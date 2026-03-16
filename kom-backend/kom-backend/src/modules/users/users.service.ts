import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../media/cloudinary.service';
import { UserRole } from '@prisma/client';
import { UpdateProfileDto, UpdateShowroomPhoneDto } from './dto';

const ACCOUNT_DELETION_PREFIX = 'ACCOUNT_DELETION_PENDING::';
const ACCOUNT_DELETION_GRACE_DAYS = 30;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getUserProfile(userId: string) {
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
      throw new NotFoundException('User not found');
    }

    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        individualProfile: true,
        showroomProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update based on role
    if (user.role === UserRole.USER_INDIVIDUAL) {
      if (user.individualProfile) {
        await this.prisma.individualProfile.update({
          where: { userId },
          data: {
            fullName: dto.fullName,
            governorate: dto.governorate,
            city: dto.city,
            avatarUrl: dto.avatarUrl,
          },
        });
      } else {
        await this.prisma.individualProfile.create({
          data: {
            userId,
            fullName: dto.fullName || 'User',
            governorate: dto.governorate,
            city: dto.city,
            avatarUrl: dto.avatarUrl,
          },
        });
      }
    } else if (user.role === UserRole.USER_SHOWROOM) {
      if (user.showroomProfile) {
        await this.prisma.showroomProfile.update({
          where: { userId },
          data: {
            showroomName: dto.showroomName,
            crNumber: dto.crNumber,
            description: dto.description,
            governorate: dto.governorate,
            city: dto.city,
            address: dto.address,
            logoUrl: dto.logoUrl,
          },
        });
      } else {
        if (!dto.showroomName) {
          throw new BadRequestException('Showroom name is required');
        }
        await this.prisma.showroomProfile.create({
          data: {
            userId,
            showroomName: dto.showroomName,
            crNumber: dto.crNumber,
            description: dto.description,
            governorate: dto.governorate,
            city: dto.city,
            address: dto.address,
            logoUrl: dto.logoUrl,
          },
        });
      }
    }

    // Update phone if provided
    if (dto.phone) {
      // Check if phone is already used
      const existingUser = await this.prisma.user.findFirst({
        where: {
          phone: dto.phone,
          id: { not: userId },
        },
      });

      if (existingUser) {
        throw new BadRequestException('Phone number already in use');
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: { phone: dto.phone },
      });
    }

    return this.getUserProfile(userId);
  }

  async addShowroomPhone(userId: string, dto: UpdateShowroomPhoneDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { showroomProfile: true },
    });

    if (!user || user.role !== UserRole.USER_SHOWROOM || !user.showroomProfile) {
      throw new BadRequestException('Showroom profile not found');
    }

    // If isPrimary, remove primary from other phones
    if (dto.isPrimary) {
      await this.prisma.showroomContactPhone.updateMany({
        where: { showroomId: user.showroomProfile.id },
        data: { isPrimary: false },
      });
    }

    const phone = await this.prisma.showroomContactPhone.create({
      data: {
        showroomId: user.showroomProfile.id,
        phone: dto.phone,
        label: dto.label,
        isPrimary: dto.isPrimary || false,
      },
    });

    return phone;
  }

  async deleteMyAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const requestedAt = new Date();
    const restoreUntil = new Date(requestedAt.getTime() + ACCOUNT_DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000);
    const metadata = {
      originalEmail: user.email,
      originalPhone: user.phone ?? null,
      requestedAt: requestedAt.toISOString(),
      restoreUntil: restoreUntil.toISOString(),
      originalIsActive: user.isActive,
    };

    const archivedEmail = `deleted.${requestedAt.getTime()}.${user.id}@deleted.local`;
    const archivedPhone = user.phone ? `deleted.${requestedAt.getTime()}.${user.phone}` : null;

    await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({ where: { userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: archivedEmail,
          phone: archivedPhone,
          isActive: false,
          isBanned: true,
          bannedReason: `${ACCOUNT_DELETION_PREFIX}${JSON.stringify(metadata)}`,
          bannedAt: requestedAt,
        },
      }),
    ]);

    return {
      message: 'Account scheduled for deletion and can be restored within 30 days',
      restoreUntil: restoreUntil.toISOString(),
    };
  }

  async removeShowroomPhone(userId: string, phoneId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { showroomProfile: true },
    });

    if (!user || user.role !== UserRole.USER_SHOWROOM || !user.showroomProfile) {
      throw new BadRequestException('Showroom profile not found');
    }

    const phone = await this.prisma.showroomContactPhone.findFirst({
      where: {
        id: phoneId,
        showroomId: user.showroomProfile.id,
      },
    });

    if (!phone) {
      throw new NotFoundException('Phone not found');
    }

    await this.prisma.showroomContactPhone.delete({
      where: { id: phoneId },
    });

    return { message: 'Phone removed successfully' };
  }

  async getUserById(userId: string) {
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
      throw new NotFoundException('User not found');
    }

    const { passwordHash: _passwordHash2, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        createdAt: true,
        individualProfile: {
          select: {
            fullName: true,
            governorate: true,
            city: true,
          },
        },
        showroomProfile: {
          select: {
            showroomName: true,
            description: true,
            governorate: true,
            city: true,
            address: true,
            logoUrl: true,
            contactPhones: {
              select: {
                phone: true,
                label: true,
                isPrimary: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async uploadAvatar(userId: string, file: { buffer: Buffer; mimetype?: string; size?: number }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        individualProfile: true,
        showroomProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!file || !file.buffer) {
      throw new BadRequestException('File is required');
    }

    const folder = `users/${userId}/avatar`;
    const resourceType = 'image';

    let uploaded;
    try {
      uploaded = await this.cloudinaryService.uploadBuffer(file.buffer, {
        folder,
        resourceType,
      });
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'message' in err &&
        typeof (err as { message?: unknown }).message === 'string'
          ? (err as { message: string }).message
          : 'Image upload failed';
      throw new BadRequestException(message);
    }

    const url = uploaded.secureUrl;

    if (user.role === UserRole.USER_INDIVIDUAL) {
      if (user.individualProfile) {
        await this.prisma.individualProfile.update({
          where: { userId },
          data: { avatarUrl: url },
        });
      } else {
        await this.prisma.individualProfile.create({
          data: {
            userId,
            fullName: 'User',
            avatarUrl: url,
          },
        });
      }
    } else if (user.role === UserRole.USER_SHOWROOM) {
      if (user.showroomProfile) {
        await this.prisma.showroomProfile.update({
          where: { userId },
          data: { logoUrl: url },
        });
      } else {
        throw new BadRequestException('Showroom profile not set up completely');
      }
    }

    return { url };
  }
}
