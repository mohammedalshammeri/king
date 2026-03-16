import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import { PaginationDto } from '../../common/dto';
import { RegisterDeviceDto } from './dto';
import { UserRole } from '@prisma/client';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushService: PushService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get my notifications' })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  async getNotifications(@CurrentUser('id') userId: string, @Query() query: PaginationDto) {
    return this.notificationsService.getUserNotifications(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async getUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(@CurrentUser('id') userId: string, @Param('id') notificationId: string) {
    return this.notificationsService.markAsRead(userId, notificationId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async deleteNotification(@CurrentUser('id') userId: string, @Param('id') notificationId: string) {
    return this.notificationsService.deleteNotification(userId, notificationId);
  }

  // ── Admin: broadcast ───────────────────────────────────────────────────────

  @Post('admin/broadcast')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send broadcast notification to all users (admin)' })
  async broadcast(
    @CurrentUser('id') adminId: string,
    @Body() body: { title: string; body: string; targetType?: 'ALL' | 'REGISTERED' },
  ) {
    return this.notificationsService.broadcastToAll(
      body.title,
      body.body,
      body.targetType ?? 'ALL',
      adminId,
    );
  }

  @Get('admin/broadcast/history')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get broadcast notification history (admin)' })
  async broadcastHistory() {
    return this.notificationsService.getBroadcastHistory();
  }

  // Device token management
  @Post('devices/token')
  @ApiOperation({ summary: 'Register device token for push notifications' })
  @ApiResponse({ status: 201, description: 'Device token registered' })
  async registerDeviceToken(@CurrentUser('id') userId: string, @Body() dto: RegisterDeviceDto) {
    await this.pushService.registerDeviceToken(userId, dto.token, dto.platform);
    return { message: 'Device token registered successfully' };
  }

  @Post('devices/token/guest')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register device token for anonymous/guest users (no auth required)' })
  @ApiResponse({ status: 200, description: 'Guest device token registered' })
  async registerGuestDeviceToken(@Body() dto: RegisterDeviceDto) {
    await this.pushService.registerDeviceToken(null, dto.token, dto.platform);
    return { message: 'Guest device token registered successfully' };
  }

  @Delete('devices/token')
  @ApiOperation({ summary: 'Unregister device token' })
  @ApiResponse({ status: 200, description: 'Device token unregistered' })
  async unregisterDeviceToken(@Body() dto: RegisterDeviceDto) {
    await this.pushService.unregisterDeviceToken(dto.token);
    return { message: 'Device token unregistered successfully' };
  }
}
