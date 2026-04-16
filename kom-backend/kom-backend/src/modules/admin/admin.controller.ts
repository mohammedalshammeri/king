import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles, Public } from '../../common/decorators';
import { UserRole } from '@prisma/client';
import {
  CreateAdminDto,
  UpdateAdminPermissionsDto,
  BanUserDto,
  RejectUserDto,
  AdminQueryDto,
  UserQueryDto,
  UpdateSystemSettingDto,
  AuditLogQueryDto,
} from './dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Dashboard
  @Get('dashboard')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Post('fix-showrooms')
  @Public() // Temporary for fixing
  async fixShowrooms() {
    return this.adminService.fixShowrooms();
  }

  // Admin user management (Super Admin only)
  @Post('admin-users')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create admin account (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Admin created' })
  async createAdmin(@CurrentUser('id') superAdminId: string, @Body() dto: CreateAdminDto) {
    return this.adminService.createAdmin(superAdminId, dto);
  }

  @Get('admin-users')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all admin users (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Admin users list' })
  async getAdminUsers(@Query() query: AdminQueryDto) {
    return this.adminService.getAdminUsers(query);
  }

  @Patch('admin-users/:id/permissions')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update admin permissions (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Permissions updated' })
  async updateAdminPermissions(
    @CurrentUser('id') superAdminId: string,
    @Param('id') adminId: string,
    @Body() dto: UpdateAdminPermissionsDto,
  ) {
    return this.adminService.updateAdminPermissions(superAdminId, adminId, dto);
  }

  @Patch('admin-users/:id/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate admin account (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Admin deactivated' })
  async deactivateAdmin(@CurrentUser('id') superAdminId: string, @Param('id') adminId: string) {
    return this.adminService.deactivateAdmin(superAdminId, adminId);
  }

  // User management
  @Get('users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users list' })
  async getAllUsers(@Query() query: UserQueryDto) {
    return this.adminService.getAllUsers(query);
  }

  @Get('users/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user details' })
  @ApiResponse({ status: 200, description: 'User details' })
  async getUserById(@Param('id') userId: string) {
    return this.adminService.getUserById(userId);
  }

  @Patch('users/:id/ban')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Ban a user' })
  @ApiResponse({ status: 200, description: 'User banned' })
  async banUser(
    @CurrentUser('id') adminId: string,
    @Param('id') userId: string,
    @Body() dto: BanUserDto,
  ) {
    return this.adminService.banUser(adminId, userId, dto);
  }

  @Patch('users/:id/unban')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Unban a user' })
  @ApiResponse({ status: 200, description: 'User unbanned' })
  async unbanUser(@CurrentUser('id') adminId: string, @Param('id') userId: string) {
    return this.adminService.unbanUser(adminId, userId);
  }

  @Patch('users/:id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve a showroom user' })
  @ApiResponse({ status: 200, description: 'User approved' })
  async approveUser(@CurrentUser('id') adminId: string, @Param('id') userId: string) {
    return this.adminService.approveUser(adminId, userId);
  }

  @Post('users/:id/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject a showroom user (deletes account)' })
  @ApiResponse({ status: 200, description: 'User rejected and deleted' })
  async rejectUser(
    @CurrentUser('id') adminId: string,
    @Param('id') userId: string,
    @Body() dto: RejectUserDto,
  ) {
    return this.adminService.rejectUser(adminId, userId, dto);
  }

  // System settings (Super Admin only)
  @Get('settings')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get system settings (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'System settings' })
  async getSystemSettings() {
    return this.adminService.getSystemSettings();
  }

  @Patch('settings')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update system setting (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Setting updated' })
  async updateSystemSetting(
    @CurrentUser('id') superAdminId: string,
    @Body() dto: UpdateSystemSettingDto,
  ) {
    return this.adminService.updateSystemSetting(superAdminId, dto);
  }

  // Audit logs
  @Get('audit-logs')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get audit logs (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Audit logs' })
  async getAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.adminService.getAuditLogs(query);
  }
}
