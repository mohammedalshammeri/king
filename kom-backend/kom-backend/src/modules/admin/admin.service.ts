import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { UserRole, Prisma, ListingStatus } from '@prisma/client';
import { PaginatedResponse, PaginationDto } from '../../common/dto';
import * as bcrypt from 'bcrypt';
import {
  CreateAdminDto,
  UpdateAdminPermissionsDto,
  BanUserDto,
  AdminQueryDto,
  UserQueryDto,
  UpdateSystemSettingDto,
} from './dto';

const ACCOUNT_DELETION_PREFIX = 'ACCOUNT_DELETION_PENDING::';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  async fixShowrooms() {
    const res = await this.prisma.user.updateMany({
      where: {
        role: UserRole.USER_SHOWROOM,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
    return { message: `Fixed ${res.count} showroom accounts` };
  }

  // Admin user management (Super Admin only)
  async createAdmin(superAdminId: string, dto: CreateAdminDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Create admin user with permissions
    const admin = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
        role: UserRole.ADMIN,
        isActive: true,
        adminPermission: {
          create: {
            canReviewListings: dto.permissions?.canReviewListings ?? true,
            canManageUsers: dto.permissions?.canManageUsers ?? false,
            canViewReports: dto.permissions?.canViewReports ?? true,
            canManageAdmins: false, // Admins cannot manage other admins
            canManageSettings: false, // Admins cannot manage settings
          },
        },
      },
      include: {
        adminPermission: true,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: superAdminId,
        action: 'ADMIN_CREATED',
        entityType: 'User',
        entityId: admin.id,
        after: {
          email: admin.email,
          role: admin.role,
          permissions: admin.adminPermission,
        },
      },
    });

    const { passwordHash: _passwordHash, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  }

  async updateAdminPermissions(
    superAdminId: string,
    adminId: string,
    dto: UpdateAdminPermissionsDto,
  ) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      include: { adminPermission: true },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (admin.role !== UserRole.ADMIN) {
      throw new BadRequestException('User is not an admin');
    }

    const beforePermissions = admin.adminPermission;

    const updatedPermission = await this.prisma.adminPermission.update({
      where: { userId: adminId },
      data: {
        canReviewListings: dto.canReviewListings,
        canManageUsers: dto.canManageUsers,
        canViewReports: dto.canViewReports,
        // canManageAdmins and canManageSettings remain false for admins
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: superAdminId,
        action: 'ADMIN_PERMISSIONS_UPDATED',
        entityType: 'AdminPermission',
        entityId: updatedPermission.id,
        before: beforePermissions ? JSON.parse(JSON.stringify(beforePermissions)) : undefined,
        after: JSON.parse(JSON.stringify(updatedPermission)),
      },
    });

    return updatedPermission;
  }

  async getAdminUsers(query: AdminQueryDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    };

    const isActive = this.parseBooleanQuery(query.isActive);
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [admins, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          isBanned: true,
          createdAt: true,
          lastLoginAt: true,
          adminPermission: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return new PaginatedResponse(admins, total, page, limit);
  }

  async deactivateAdmin(superAdminId: string, adminId: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (admin.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot deactivate Super Admin');
    }

    await this.prisma.user.update({
      where: { id: adminId },
      data: { isActive: false },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: superAdminId,
        action: 'ADMIN_DEACTIVATED',
        entityType: 'User',
        entityId: adminId,
        before: { isActive: true },
        after: { isActive: false },
      },
    });

    return { message: 'Admin deactivated successfully' };
  }

  // User management (for admins with permission)
  async getAllUsers(query: UserQueryDto) {
    console.log('AdminService.getAllUsers query:', query);
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: { in: [UserRole.USER_INDIVIDUAL, UserRole.USER_SHOWROOM] },
      OR: [
        { bannedReason: null },
        { bannedReason: { not: { startsWith: ACCOUNT_DELETION_PREFIX } } }
      ],
    };

    if (query.role) {
      where.role = query.role;
    }

    const isActive = this.parseBooleanQuery(query.isActive);
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const isBanned = this.parseBooleanQuery(query.isBanned);
    if (isBanned !== undefined) {
      where.isBanned = isBanned;
    }

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          isBanned: true,
          bannedReason: true,
          bannedAt: true,
          createdAt: true,
          lastLoginAt: true,
          individualProfile: { 
            select: { 
              fullName: true, 
              governorate: true, 
              city: true 
            } 
          },
          showroomProfile: { 
            select: { 
              showroomName: true, 
              crNumber: true, 
              governorate: true, 
              city: true,
              merchantType: true 
            } 
          },
          _count: { select: { listings: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return new PaginatedResponse(users, total, page, limit);
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isBanned: true,
        bannedReason: true,
        bannedAt: true,
        createdAt: true,
        lastLoginAt: true,
        individualProfile: true,
        showroomProfile: {
          include: { contactPhones: true },
        },
        listings: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            listings: true,
            reports: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async approveUser(adminId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        individualProfile: { select: { fullName: true } },
        showroomProfile: { select: { showroomName: true } },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isActive) {
      throw new BadRequestException('User is already active');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'USER_APPROVED',
        entityType: 'User',
        entityId: userId,
        before: { isActive: false },
        after: { isActive: true },
      },
    });

    // Send approval email
    const displayName =
      user.individualProfile?.fullName || user.showroomProfile?.showroomName || user.email;
    this.emailService.sendAccountApproved(user.email, displayName).catch(() => {});

    return { message: 'User approved successfully' };
  }

  async rejectUser(adminId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        individualProfile: { select: { fullName: true } },
        showroomProfile: { select: { showroomName: true } },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Send rejection email BEFORE deleting (so we still have email/name)
    const displayName =
      user.individualProfile?.fullName || user.showroomProfile?.showroomName || user.email;
    this.emailService.sendAccountRejected(user.email, displayName).catch(() => {});

    // Capture data for log before delete
    const userData = { email: user.email, role: user.role };

    await this.prisma.user.delete({
      where: { id: userId },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'USER_REJECTED',
        entityType: 'User',
        entityId: userId,
        before: { userData },
        after: Prisma.JsonNull,
      },
    });

    return { message: 'User rejected and deleted' };
  }

  async banUser(adminId: string, userId: string, dto: BanUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot ban admin users');
    }

    if (user.isBanned) {
      throw new BadRequestException('User is already banned');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        bannedReason: dto.reason,
        bannedAt: new Date(),
      },
    });

    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'USER_BANNED',
        entityType: 'User',
        entityId: userId,
        before: { isBanned: false },
        after: { isBanned: true, reason: dto.reason },
      },
    });

    // Notify user
    await this.notificationsService.notifyAccountBanned(userId, dto.reason);

    return { message: 'User banned successfully' };
  }

  async unbanUser(adminId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isBanned) {
      throw new BadRequestException('User is not banned');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        bannedReason: null,
        bannedAt: null,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'USER_UNBANNED',
        entityType: 'User',
        entityId: userId,
        before: { isBanned: true },
        after: { isBanned: false },
      },
    });

    // Notify user
    await this.notificationsService.notifyAccountUnbanned(userId);

    return { message: 'User unbanned successfully' };
  }

  // System settings (Super Admin only)
  async getSystemSettings() {
    const settings = await this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });

    // Convert to key-value object
    const settingsObj: Record<string, string | number | boolean | unknown> = {};
    for (const setting of settings) {
      settingsObj[setting.key] = this.parseSettingValue(setting.value, setting.type);
    }

    return settingsObj;
  }

  async updateSystemSetting(superAdminId: string, dto: UpdateSystemSettingDto) {
    const existingSetting = await this.prisma.systemSetting.findUnique({
      where: { key: dto.key },
    });

    const beforeValue = existingSetting?.value;

    const setting = await this.prisma.systemSetting.upsert({
      where: { key: dto.key },
      create: {
        key: dto.key,
        value: String(dto.value),
        type: dto.type || 'string',
      },
      update: {
        value: String(dto.value),
        type: dto.type,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: superAdminId,
        action: 'SETTING_UPDATED',
        entityType: 'SystemSetting',
        entityId: setting.id,
        before: { value: beforeValue },
        after: { value: setting.value },
      },
    });

    return setting;
  }

  // Audit logs
  async getAuditLogs(query: PaginationDto & { actorId?: string; action?: string }) {
    const { page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (query.actorId) {
      where.actorId = query.actorId;
    }

    if (query.action) {
      where.action = { contains: query.action };
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return new PaginatedResponse(logs, total, page, limit);
  }

  // Dashboard stats
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const listingStatsWhere = {
      status: {
        in: [
          ListingStatus.PENDING_REVIEW,
          ListingStatus.APPROVED,
          ListingStatus.REJECTED,
          ListingStatus.SOLD,
        ],
      },
    };

    const [totalUsers, newUsersToday, totalListings, pendingListings, activeListings, openReports] =
      await Promise.all([
        this.prisma.user.count({
          where: { role: { in: [UserRole.USER_INDIVIDUAL, UserRole.USER_SHOWROOM] } },
        }),
        this.prisma.user.count({
          where: {
            role: { in: [UserRole.USER_INDIVIDUAL, UserRole.USER_SHOWROOM] },
            createdAt: { gte: today },
          },
        }),
        this.prisma.listing.count({ where: listingStatsWhere }),
        this.prisma.listing.count({ where: { status: ListingStatus.PENDING_REVIEW } }),
        this.prisma.listing.count({ where: { status: ListingStatus.APPROVED } }),
        this.prisma.report.count({ where: { status: 'OPEN' } }),
      ]);

    // Users by type
    const usersByType = await this.prisma.user.groupBy({
      by: ['role'],
      where: { role: { in: [UserRole.USER_INDIVIDUAL, UserRole.USER_SHOWROOM] } },
      _count: true,
    });

    // Listings by type
    const listingsByType = await this.prisma.listing.groupBy({
      by: ['type'],
      where: listingStatsWhere,
      _count: true,
    });

    return {
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        byType: usersByType.map((u) => ({ type: u.role, count: u._count })),
      },
      listings: {
        total: totalListings,
        pending: pendingListings,
        active: activeListings,
        byType: listingsByType.map((l) => ({ type: l.type, count: l._count })),
      },
      reports: {
        open: openReports,
      },
    };
  }

  private parseSettingValue(value: string, type: string): string | number | boolean | unknown {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  private parseBooleanQuery(value?: string): boolean | undefined {
    if (value === undefined) return undefined;
    const normalized = String(value).toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
    return undefined;
  }
}
