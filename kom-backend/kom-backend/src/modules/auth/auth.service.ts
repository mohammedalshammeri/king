import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { LuckService } from '../luck/luck.service';
import { NotificationType, UserRole } from '@prisma/client';
import { RegisterDto, LoginDto, RefreshTokenDto, AuthResponseDto, TokenPayload } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly luckService: LuckService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists (same email → any role blocked)
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, dto.phone ? { phone: dto.phone } : undefined].filter(
          (condition): condition is { email: string } | { phone: string } => Boolean(condition),
        ),
      },
    });

    if (existingUser) {
      if (existingUser.email === dto.email) {
        throw new ConflictException(
          existingUser.role === UserRole.USER_SHOWROOM
            ? 'هذا البريد الإلكتروني مسجل بحساب تاجر مسبقاً. لا يمكن إنشاء حساب آخر بنفس البريد.'
            : 'هذا البريد الإلكتروني مسجل بحساب فرد مسبقاً. لا يمكن إنشاء حساب آخر بنفس البريد.',
        );
      }
      throw new ConflictException('User with this email or phone already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Determine role
    const role = dto.userType === 'SHOWROOM' ? UserRole.USER_SHOWROOM : UserRole.USER_INDIVIDUAL;

    // Create user with profile
    const user = await this.prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          passwordHash: hashedPassword,
          role,
          // Both roles require admin approval before they can log in
          isActive: false,
        },
      });

      // Create profile based on user type
      if (role === UserRole.USER_INDIVIDUAL) {
        await prisma.individualProfile.create({
          data: {
            userId: newUser.id,
            fullName: dto.fullName || 'User',
            governorate: dto.governorate,
            city: dto.city,
          },
        });
      } else if (role === UserRole.USER_SHOWROOM) {
        if (!dto.showroomName) {
          throw new BadRequestException('Showroom name is required for showroom accounts');
        }
        await prisma.showroomProfile.create({
          data: {
            userId: newUser.id,
            showroomName: dto.showroomName,
            crNumber: dto.crNumber,
            merchantType: dto.merchantType ?? null,
            governorate: dto.governorate,
            city: dto.city,
          },
        });
      }

      return newUser;
    });

    await this.notificationsService.notifyAdmins(
      NotificationType.SYSTEM,
      'تسجيل حساب جديد',
      role === UserRole.USER_SHOWROOM
        ? `تم تسجيل معرض جديد (${user.email}) ويحتاج للمراجعة والموافقة.`
        : `تم تسجيل حساب فرد جديد (${user.email}) ويحتاج للمراجعة والموافقة.`,
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        userType: role === UserRole.USER_SHOWROOM ? 'SHOWROOM' : 'INDIVIDUAL',
      },
    );

    // Assign luck code if feature is active
    const luckCode = await this.luckService.assignCodeToNewUser(user.id);

    // Both roles return PENDING — no tokens issued until admin approves
    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        luckCode: luckCode ?? undefined,
      },
      accessToken: null as unknown as string,
      refreshToken: null as unknown as string,
      message:
        role === UserRole.USER_SHOWROOM
          ? 'Registration successful. Your showroom account is under review.'
          : 'Registration successful. Your account is pending admin approval.',
    } as unknown as AuthResponseDto;
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        individualProfile: true,
        showroomProfile: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is banned
    if (user.isBanned) {
      throw new ForbiddenException('Your account has been banned');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ForbiddenException('Your account is not active');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Save refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify<TokenPayload>(dto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      // Check if refresh token exists and is valid
      const storedToken = await this.prisma.refreshToken.findFirst({
        where: {
          userId: payload.sub,
          token: dto.refreshToken,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if user is banned or inactive
      if (storedToken.user.isBanned || !storedToken.user.isActive) {
        throw new ForbiddenException('Account is not accessible');
      }

      // Revoke old refresh token
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });

      // Generate new tokens
      const tokens = await this.generateTokens(
        storedToken.user.id,
        storedToken.user.email,
        storedToken.user.role,
      );

      // Save new refresh token
      await this.saveRefreshToken(storedToken.user.id, tokens.refreshToken);

      return {
        user: {
          id: storedToken.user.id,
          email: storedToken.user.email,
          phone: storedToken.user.phone,
          role: storedToken.user.role,
        },
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Revoke specific refresh token
      await this.prisma.refreshToken.updateMany({
        where: { userId, token: refreshToken },
        data: { isRevoked: true },
      });
    } else {
      // Revoke all refresh tokens for user
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        individualProfile: true,
        showroomProfile: {
          include: {
            contactPhones: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save token to database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpiry: resetTokenExpiry,
      },
    });

    // Send password reset email via Resend
    await this.emailService.sendPasswordReset(email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      },
    });

    // Invalidate all refresh tokens for security
    await this.prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new BadRequestException('User not found or has no password set');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid current password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });
  }

  async validateUser(payload: TokenPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.isBanned || !user.isActive) {
      return null;
    }

    return user;
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: TokenPayload = {
      sub: userId,
      email,
      role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiration'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiration'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string): Promise<void> {
    const expiresIn = this.configService.get<string>('jwt.refreshExpiration') || '7d';
    const expiresAt = this.calculateExpirationDate(expiresIn);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    // Clean up old tokens (keep only last 5)
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: 5,
    });

    if (tokens.length > 0) {
      await this.prisma.refreshToken.deleteMany({
        where: { id: { in: tokens.map((t) => t.id) } },
      });
    }
  }

  private calculateExpirationDate(expiresIn: string): Date {
    const now = new Date();
    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
      // Default to 7 days
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return new Date(now.getTime() + value * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }
}
