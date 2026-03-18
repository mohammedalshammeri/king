import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private expo: Expo;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.expo = new Expo();
  }

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
    // Check if token is a valid Expo push token
    if (!Expo.isExpoPushToken(token)) {
      const tokenPreview = String(token).substring(0, 10);
      this.logger.warn(`Invalid Expo push token: ${tokenPreview}...`);
      throw new Error('messaging/invalid-registration-token');
    }

    // Prepare the message
    const message: ExpoPushMessage = {
      to: token,
      sound: 'default',
      title,
      body,
      data: data || {},
      priority: 'high',
    };

    try {
      // Send the notification
      const tickets = await this.expo.sendPushNotificationsAsync([message]);
      
      // Check for errors in tickets
      const ticket = tickets[0];
      if (ticket.status === 'error') {
        this.logger.error(`Error sending push notification: ${ticket.message}`);
        
        // Check if it's an invalid token error
        if (ticket.details?.error === 'DeviceNotRegistered') {
          throw new Error('messaging/registration-token-not-registered');
        }
        
        throw new Error(ticket.message);
      }
      
      const ticketId = ticket.status === 'ok' && 'id' in ticket ? ticket.id : 'unknown';
      
      this.logger.log(`Push notification sent successfully to ${platform}:`, {
        token: token.substring(0, 10) + '...',
        title,
        ticketId,
      });
    } catch (error) {
      this.logger.error(`Failed to send push notification:`, error);
      throw error;
    }
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
