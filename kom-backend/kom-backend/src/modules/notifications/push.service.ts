import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<boolean> {
    // Get user's device tokens
    const deviceTokens = await this.prisma.deviceToken.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    if (deviceTokens.length === 0) {
      this.logger.log(`No active device tokens for user ${userId}`);
      return false;
    }

    // Stub implementation for FCM/APNs
    // In production, this would integrate with Firebase Admin SDK or APNs
    for (const device of deviceTokens) {
      try {
        await this.sendToDevice(device.token, device.platform, title, body, data);
        this.logger.log(`Push notification sent to ${device.platform} device for user ${userId}`);
      } catch (error) {
        this.logger.error(`Failed to send push notification to device ${device.id}:`, error);

        // Mark token as inactive if it's invalid
        if (this.isInvalidTokenError(error)) {
          await this.prisma.deviceToken.update({
            where: { id: device.id },
            data: { isActive: false },
          });
        }
      }
    }

    return true;
  }

  async sendToDevice(
    token: string,
    platform: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    // Stub implementation
    // In production:
    // - For FCM: Use firebase-admin SDK
    // - For APNs: Use @parse/node-apn or similar

    const fcmProjectId = this.configService.get<string>('fcm.projectId');

    if (!fcmProjectId) {
      this.logger.warn('FCM not configured, skipping push notification');
      return;
    }

    // Placeholder for actual implementation
    this.logger.log(`[STUB] Sending push to ${platform}:`, {
      token: token.substring(0, 10) + '...',
      title,
      body,
      data,
    });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private isInvalidTokenError(error: { code?: string; message?: string }): boolean {
    // Check for common invalid token error codes
    // This would be provider-specific in production
    const invalidTokenCodes = [
      'messaging/invalid-registration-token',
      'messaging/registration-token-not-registered',
      'InvalidRegistration',
      'NotRegistered',
    ];

    return invalidTokenCodes.some((code) => error?.code === code || error?.message?.includes(code));
  }

  async registerDeviceToken(
    userId: string | null,
    token: string,
    platform: 'ios' | 'android',
  ): Promise<void> {
    await this.prisma.deviceToken.upsert({
      where: { token },
      create: {
        ...(userId ? { userId } : {}),
        token,
        platform,
        isActive: true,
      },
      update: {
        ...(userId ? { userId } : {}),
        platform,
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }

  async sendPushToGuestTokens(
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<number> {
    const guestTokens = await this.prisma.deviceToken.findMany({
      where: { userId: null, isActive: true },
    });
    for (const device of guestTokens) {
      try {
        await this.sendToDevice(device.token, device.platform, title, body, data);
      } catch (error) {
        if (this.isInvalidTokenError(error)) {
          await this.prisma.deviceToken.update({
            where: { id: device.id },
            data: { isActive: false },
          });
        }
      }
    }
    return guestTokens.length;
  }

  async unregisterDeviceToken(token: string): Promise<void> {
    await this.prisma.deviceToken.updateMany({
      where: { token },
      data: { isActive: false },
    });
  }
}
