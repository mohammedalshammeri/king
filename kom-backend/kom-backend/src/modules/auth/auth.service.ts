import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, TokenPayload as GoogleTokenPayload } from 'google-auth-library';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { LuckService } from '../luck/luck.service';
import { NotificationType, UserRole } from '@prisma/client';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  AuthResponseDto,
  SocialAuthDto,
  SocialProvider,
  TokenPayload,
  UserType,
} from './dto';

const ACCOUNT_DELETION_PREFIX = 'ACCOUNT_DELETION_PENDING::';
const ACCOUNT_DELETION_GRACE_DAYS = 30;

type PendingDeletionMetadata = {
  originalEmail: string;
  originalPhone: string | null;
  requestedAt: string;
  restoreUntil: string;
  originalIsActive: boolean;
};

type SocialProfile = {
  email?: string;
  fullName?: string;
  providerUserId: string;
};

const APPLE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly luckService: LuckService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const normalizedEmail = this.normalizeEmail(dto.email);

    const pendingDeletedUser = await this.findPendingDeletedAccountByEmail(normalizedEmail);
    if (pendingDeletedUser) {
      this.throwPendingDeletionException(pendingDeletedUser);
    }

    // Check if user already exists (same email → any role blocked)
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, dto.phone ? { phone: dto.phone } : undefined].filter(
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
          email: normalizedEmail,
          phone: dto.phone,
          passwordHash: hashedPassword,
          role,
          // Both individual and showroom accounts are active immediately.
          isActive: true,
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

    if (role === UserRole.USER_SHOWROOM) {
      await this.notificationsService.notifyAdmins(
        NotificationType.SYSTEM,
        'تسجيل معرض جديد',
        `تم تسجيل معرض جديد (${user.email}) وهو مفعل مباشرة.`,
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          userType: 'SHOWROOM',
        },
      );
    } else if (role === UserRole.USER_INDIVIDUAL) {
      await this.notificationsService.notifyAdmins(
        NotificationType.SYSTEM,
        'مستخدم فردي جديد',
        `تم تسجيل مستخدم فردي جديد (${user.email}).`,
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          userType: 'INDIVIDUAL',
        },
      );
    }

    // Assign luck code if feature is active
    const luckCode = await this.luckService.assignCodeToNewUser(user.id);

    // Both individual and showroom users receive tokens immediately.
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        luckCode: luckCode ?? undefined,
      },
      ...tokens,
      message: 'Registration successful. Welcome to King of the Market!',
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const normalizedEmail = this.normalizeEmail(dto.email);

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        individualProfile: true,
        showroomProfile: true,
      },
    });

    if (!user) {
      const pendingDeletedUser = await this.findPendingDeletedAccountByEmail(normalizedEmail);
      if (pendingDeletedUser) {
        this.throwPendingDeletionException(pendingDeletedUser);
      }
    }

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

  async socialAuth(dto: SocialAuthDto): Promise<AuthResponseDto> {
    const profile = await this.verifySocialIdentity(dto.provider, dto.idToken);

    if (!profile.email) {
      throw new BadRequestException('Unable to determine email from the social provider');
    }

    const normalizedEmail = this.normalizeEmail(profile.email);
    const pendingDeletedUser = await this.findPendingDeletedAccountByEmail(normalizedEmail);
    if (pendingDeletedUser) {
      this.throwPendingDeletionException(pendingDeletedUser);
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        individualProfile: true,
        showroomProfile: true,
      },
    });

    if (existingUser) {
      if (existingUser.isBanned) {
        throw new ForbiddenException('Your account has been banned');
      }

      if (!existingUser.isActive) {
        throw new ForbiddenException('Your account is not active');
      }

      await this.prisma.user.update({
        where: { id: existingUser.id },
        data: { lastLoginAt: new Date() },
      });

      const tokens = await this.generateTokens(existingUser.id, existingUser.email, existingUser.role);
      await this.saveRefreshToken(existingUser.id, tokens.refreshToken);

      return {
        user: {
          id: existingUser.id,
          email: existingUser.email,
          phone: existingUser.phone,
          role: existingUser.role,
        },
        ...tokens,
      };
    }

    const createdUser = await this.createSocialUser(dto, normalizedEmail, profile.fullName);
    const luckCode = await this.luckService.assignCodeToNewUser(createdUser.id);
    const tokens = await this.generateTokens(createdUser.id, createdUser.email, createdUser.role);
    await this.saveRefreshToken(createdUser.id, tokens.refreshToken);
    await this.prisma.user.update({
      where: { id: createdUser.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      user: {
        id: createdUser.id,
        email: createdUser.email,
        phone: createdUser.phone,
        role: createdUser.role,
        luckCode: luckCode ?? undefined,
      },
      ...tokens,
      message: 'Social authentication successful',
    };
  }

  async restoreAccount(dto: { email: string; password: string }): Promise<AuthResponseDto> {
    const normalizedEmail = this.normalizeEmail(dto.email);
    const user = await this.findPendingDeletedAccountByEmail(normalizedEmail);

    if (!user) {
      throw new NotFoundException('No recently deleted account found for this email');
    }

    const metadata = this.parsePendingDeletionMetadata(user.bannedReason);
    if (!metadata || !this.isWithinDeletionWindow(metadata)) {
      throw new ConflictException('The account can no longer be restored. Please register again.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const emailTaken = await this.prisma.user.findFirst({
      where: { id: { not: user.id }, email: normalizedEmail },
      select: { id: true },
    });

    if (emailTaken) {
      throw new ConflictException('This email is already in use by another account');
    }

    if (metadata.originalPhone) {
      const phoneTaken = await this.prisma.user.findFirst({
        where: { id: { not: user.id }, phone: metadata.originalPhone },
        select: { id: true },
      });

      if (phoneTaken) {
        throw new ConflictException('The phone number is already in use by another account');
      }
    }

    const restoredUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: metadata.originalEmail,
        phone: metadata.originalPhone,
        isActive: metadata.originalIsActive,
        isBanned: false,
        bannedReason: null,
        bannedAt: null,
        lastLoginAt: new Date(),
      },
    });

    await this.prisma.refreshToken.deleteMany({ where: { userId: restoredUser.id } });

    const tokens = await this.generateTokens(restoredUser.id, restoredUser.email, restoredUser.role);
    await this.saveRefreshToken(restoredUser.id, tokens.refreshToken);

    return {
      user: {
        id: restoredUser.id,
        email: restoredUser.email,
        phone: restoredUser.phone,
        role: restoredUser.role,
      },
      ...tokens,
      message: 'Your account has been restored successfully.',
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
      if (error instanceof HttpException) {
        throw error;
      }

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

  private async verifySocialIdentity(
    provider: SocialProvider,
    idToken: string,
  ): Promise<SocialProfile> {
    switch (provider) {
      case SocialProvider.GOOGLE:
        return this.verifyGoogleIdentity(idToken);
      case SocialProvider.APPLE:
        return this.verifyAppleIdentity(idToken);
      default:
        throw new BadRequestException('Unsupported social provider');
    }
  }

  private async verifyGoogleIdentity(idToken: string): Promise<SocialProfile> {
    const audiences = this.configService.get<string[]>('auth.googleClientIds') || [];
    if (!audiences.length) {
      throw new BadRequestException('Google sign-in is not configured on the server');
    }

    let payload: GoogleTokenPayload | undefined;

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: audiences,
      });
      payload = ticket.getPayload();
    } catch (error) {
      const jwtPayload = this.decodeJwtWithoutVerification(idToken);
      this.logger.warn('Rejected Google social token', {
        configuredAudiences: audiences,
        tokenAudience: jwtPayload?.aud,
        authorizedParty: jwtPayload?.azp,
        issuer: jwtPayload?.iss,
        email: jwtPayload?.email,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new UnauthorizedException('Invalid Google identity token');
    }

    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw new UnauthorizedException('Invalid Google identity token');
    }

    return {
      email: payload.email,
      fullName: payload.name,
      providerUserId: payload.sub,
    };
  }

  private async verifyAppleIdentity(idToken: string): Promise<SocialProfile> {
    const audience = this.configService.get<string>('auth.appleAudience');
    if (!audience) {
      throw new BadRequestException('Apple sign-in is not configured on the server');
    }

    let payload;

    try {
      ({ payload } = await jwtVerify(idToken, APPLE_JWKS, {
        issuer: 'https://appleid.apple.com',
        audience,
      }));
    } catch (error) {
      const jwtPayload = this.decodeJwtWithoutVerification(idToken);
      this.logger.warn('Rejected Apple social token', {
        configuredAudience: audience,
        tokenAudience: jwtPayload?.aud,
        issuer: jwtPayload?.iss,
        subject: jwtPayload?.sub,
        email: jwtPayload?.email,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new UnauthorizedException('Invalid Apple identity token');
    }

    const email = typeof payload.email === 'string' ? payload.email : undefined;
    const subject = typeof payload.sub === 'string' ? payload.sub : undefined;
    const emailVerified = payload.email_verified === true || payload.email_verified === 'true';

    if (!subject || (email && !emailVerified)) {
      throw new UnauthorizedException('Invalid Apple identity token');
    }

    return {
      email,
      providerUserId: subject,
    };
  }

  private decodeJwtWithoutVerification(token: string): Record<string, unknown> | null {
    try {
      const [, payload] = token.split('.');
      if (!payload) {
        return null;
      }

      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const decoded = Buffer.from(padded, 'base64').toString('utf8');
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private async createSocialUser(
    dto: SocialAuthDto,
    normalizedEmail: string,
    providerFullName?: string,
  ) {
    const role = dto.userType === UserType.SHOWROOM ? UserRole.USER_SHOWROOM : UserRole.USER_INDIVIDUAL;

    if (dto.phone) {
      const existingPhoneUser = await this.prisma.user.findFirst({
        where: { phone: dto.phone },
        select: { id: true },
      });

      if (existingPhoneUser) {
        throw new ConflictException('User with this phone already exists');
      }
    }

    const user = await this.prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          phone: dto.phone,
          role,
          isActive: true,
        },
      });

      if (role === UserRole.USER_INDIVIDUAL) {
        await prisma.individualProfile.create({
          data: {
            userId: newUser.id,
            fullName: dto.fullName?.trim() || providerFullName?.trim() || 'User',
            governorate: dto.governorate,
            city: dto.city,
          },
        });
      } else {
        if (!dto.showroomName?.trim()) {
          throw new BadRequestException('Showroom name is required for showroom accounts');
        }

        await prisma.showroomProfile.create({
          data: {
            userId: newUser.id,
            showroomName: dto.showroomName.trim(),
            crNumber: dto.crNumber,
            merchantType: dto.merchantType ?? null,
            governorate: dto.governorate,
            city: dto.city,
          },
        });
      }

      return newUser;
    });

    await this.notifyNewRegistration(user.id, user.email, user.role);

    return user;
  }

  private async notifyNewRegistration(userId: string, email: string, role: UserRole): Promise<void> {
    if (role === UserRole.USER_SHOWROOM) {
      await this.notificationsService.notifyAdmins(
        NotificationType.SYSTEM,
        'تسجيل معرض جديد',
        `تم تسجيل معرض جديد (${email}) وهو مفعل مباشرة.`,
        {
          userId,
          email,
          role,
          userType: 'SHOWROOM',
        },
      );
      return;
    }

    await this.notificationsService.notifyAdmins(
      NotificationType.SYSTEM,
      'مستخدم فردي جديد',
      `تم تسجيل مستخدم فردي جديد (${email}).`,
      {
        userId,
        email,
        role,
        userType: 'INDIVIDUAL',
      },
    );
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

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private parsePendingDeletionMetadata(reason?: string | null): PendingDeletionMetadata | null {
    if (!reason || !reason.startsWith(ACCOUNT_DELETION_PREFIX)) {
      return null;
    }

    try {
      return JSON.parse(reason.slice(ACCOUNT_DELETION_PREFIX.length)) as PendingDeletionMetadata;
    } catch {
      return null;
    }
  }

  private isWithinDeletionWindow(metadata: PendingDeletionMetadata): boolean {
    return new Date(metadata.restoreUntil).getTime() > Date.now();
  }

  private async findPendingDeletedAccountByEmail(email: string) {
    const candidate = await this.prisma.user.findFirst({
      where: {
        isBanned: true,
        bannedReason: { contains: email },
      },
    });

    if (!candidate) {
      return null;
    }

    const metadata = this.parsePendingDeletionMetadata(candidate.bannedReason);
    if (!metadata || metadata.originalEmail !== email) {
      return null;
    }

    if (!this.isWithinDeletionWindow(metadata)) {
      return null;
    }

    return candidate;
  }

  private throwPendingDeletionException(user: {
    bannedReason?: string | null;
  }) {
    const metadata = this.parsePendingDeletionMetadata(user.bannedReason);
    if (!metadata) {
      throw new ConflictException('This account is pending deletion.');
    }

    const restoreUntil = new Date(metadata.restoreUntil);
    const msLeft = Math.max(restoreUntil.getTime() - Date.now(), 0);
    const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));

    throw new ConflictException({
      message: `تم حذف هذا الحساب مؤقتاً. يمكنك استرجاعه خلال ${daysLeft} يوم.`,
      error: 'ACCOUNT_RECOVERY_REQUIRED',
      details: {
        restoreUntil: metadata.restoreUntil,
        daysLeft,
        canRestore: true,
      },
    });
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
