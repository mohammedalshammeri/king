import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ListingStatus, NotificationType, SubscriptionStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';

const LISTING_EXPIRY_WARNING_DAYS = [5, 3, 1];

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Runs daily at midnight.
   * - Warns listing owners before listing expiry
   * - Auto-expires listings once their 30-day lifetime ends
   * - Marks expired subscriptions as EXPIRED
   * - Warns merchants whose subscription expires within 3 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyTasks() {
    this.logger.debug('Running daily tasks...');
    await Promise.all([
      this.handleListingExpiryWarnings(),
      this.handleListingExpiry(),
      this.handleSubscriptionExpiry(),
    ]);
  }

  private async handleListingExpiryWarnings() {
    const now = new Date();

    const approvedListings = await this.prisma.listing.findMany({
      where: {
        status: ListingStatus.APPROVED,
        expiresAt: { gt: now },
      },
      select: { id: true, ownerId: true, title: true, expiresAt: true },
    });

    const warningIds: string[] = [];
    for (const listing of approvedListings) {
      if (!listing.expiresAt) continue;

      const daysLeft = Math.ceil(
        (listing.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (LISTING_EXPIRY_WARNING_DAYS.includes(daysLeft)) {
        warningIds.push(listing.id);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const existing = await this.prisma.notification.findFirst({
          where: {
            userId: listing.ownerId,
            type: NotificationType.LISTING_EXPIRY_WARNING,
            createdAt: { gte: todayStart },
            metadata: { path: ['listingId'], equals: listing.id },
          },
        });
        if (!existing) {
          await this.prisma.notification
            .create({
              data: {
                userId: listing.ownerId,
                type: NotificationType.LISTING_EXPIRY_WARNING,
                title: 'إعلانك سينتهي قريباً',
                body: `إعلانك "${listing.title}" سينتهي خلال ${daysLeft} ${daysLeft === 1 ? 'يوم' : 'أيام'}. جدد أو أعد نشره قبل الانتهاء إذا لزم.`,
                metadata: { listingId: listing.id, daysLeft },
                isRead: false,
              },
            })
            .catch(() => {});
        }
      }
    }

    if (warningIds.length > 0) {
      this.logger.log(`Sent expiry warnings for ${warningIds.length} listings.`);
    }
  }

  private async handleListingExpiry() {
    const now = new Date();
    const expiredListings = await this.prisma.listing.findMany({
      where: {
        status: ListingStatus.APPROVED,
        expiresAt: { lte: now },
      },
      select: {
        id: true,
        ownerId: true,
        title: true,
      },
    });

    for (const listing of expiredListings) {
      await this.prisma.listing.update({
        where: { id: listing.id },
        data: {
          status: ListingStatus.EXPIRED,
          soldCheckCount: 0,
          lastSoldCheckAt: null,
        },
      });

      await this.prisma.notification
        .create({
          data: {
            userId: listing.ownerId,
            type: NotificationType.LISTING_EXPIRY_WARNING,
            title: 'انتهت مدة إعلانك',
            body: `انتهت مدة إعلانك "${listing.title}" بعد 30 يوماً وتمت إزالته تلقائياً من الظهور. يمكنك إعادة نشره متى شئت.`,
            metadata: {
              listingId: listing.id,
              reason: 'listing_expired',
            },
            isRead: false,
          },
        })
        .catch(() => {});
    }

    if (expiredListings.length > 0) {
      this.logger.log(`Expired ${expiredListings.length} listings whose 30-day lifetime ended.`);
    }
  }

  private async handleSubscriptionExpiry() {
    const now = new Date();

    // Mark expired subscriptions
    const expired = await this.prisma.subscription.updateMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: { lte: now },
      },
      data: { status: SubscriptionStatus.EXPIRED },
    });

    if (expired.count > 0) {
      this.logger.log(`Marked ${expired.count} subscriptions as expired.`);

      // Notify affected users
      const expiredSubs = await this.prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.EXPIRED,
          endDate: { lte: now },
          updatedAt: { gte: new Date(now.getTime() - 60 * 1000) }, // just updated
        },
        select: {
          userId: true,
          user: {
            select: {
              email: true,
              individualProfile: { select: { fullName: true } },
              showroomProfile: { select: { showroomName: true } },
            },
          },
        },
      });

      for (const sub of expiredSubs) {
        await this.prisma.notification
          .create({
            data: {
              userId: sub.userId,
              type: NotificationType.SUBSCRIPTION_EXPIRED,
              title: 'انتهى اشتراكك',
              body: 'انتهى اشتراكك الشهري. يرجى تجديد الاشتراك لمتابعة نشر الإعلانات.',
              isRead: false,
            },
          })
          .catch(() => {});

        // Send email
        if (sub.user?.email) {
          const displayName =
            sub.user.individualProfile?.fullName ??
            sub.user.showroomProfile?.showroomName ??
            'عميلنا';
          this.emailService.sendSubscriptionExpired(sub.user.email, displayName).catch(() => {});
        }
      }
    }

    // Warn users whose subscription expires within 3 days
    const warnBefore = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const expiringSoon = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: { gt: now, lte: warnBefore },
      },
      select: {
        userId: true,
        endDate: true,
        user: {
          select: {
            email: true,
            individualProfile: { select: { fullName: true } },
            showroomProfile: { select: { showroomName: true } },
          },
        },
      },
    });

    for (const sub of expiringSoon) {
      const daysLeft = Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      // Check if we already warned today
      const alreadyWarned = await this.prisma.notification.findFirst({
        where: {
          userId: sub.userId,
          type: NotificationType.SUBSCRIPTION_EXPIRY_WARNING,
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          },
        },
      });
      if (!alreadyWarned) {
        await this.prisma.notification
          .create({
            data: {
              userId: sub.userId,
              type: NotificationType.SUBSCRIPTION_EXPIRY_WARNING,
              title: 'اشتراكك سينتهي قريباً',
              body: `اشتراكك سينتهي خلال ${daysLeft} ${daysLeft === 1 ? 'يوم' : 'أيام'}. يرجى التجديد.`,
              isRead: false,
            },
          })
          .catch(() => {});

        // Send email
        if (sub.user?.email) {
          const displayName =
            sub.user.individualProfile?.fullName ??
            sub.user.showroomProfile?.showroomName ??
            'عميلنا';
          this.emailService
            .sendSubscriptionExpiryWarning(sub.user.email, displayName, daysLeft, sub.endDate)
            .catch(() => {});
        }
      }
    }

    if (expiringSoon.length > 0) {
      this.logger.log(`Sent subscription expiry warnings to ${expiringSoon.length} users.`);
    }
  }
}
