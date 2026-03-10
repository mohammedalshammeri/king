import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ListingStatus, NotificationType, SubscriptionStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';

// Number of unanswered sold-check notifications before auto-expiring the listing
const SOLD_CHECK_MAX_UNANSWERED = 3;
// Days after posting to start sending sold-check notifications
const SOLD_CHECK_START_DAY = 30;
// Interval in days between sold-check notifications
const SOLD_CHECK_INTERVAL_DAYS = 5;

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Runs daily at midnight.
   * - Warns listing owners every 5 days starting at day 20 (days 20, 25, 30)
   * - Sends "is it sold?" check every 5 days starting at day 30 (up to 3 times)
   * - Auto-expires listings that did not respond after 3 sold-check notifications
   * - Marks expired subscriptions as EXPIRED
   * - Warns merchants whose subscription expires within 3 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyTasks() {
    this.logger.debug('Running daily tasks...');
    await Promise.all([
      this.handleListingExpiryWarnings(),
      this.handleSoldCheck(),
      this.handleSubscriptionExpiry(),
    ]);
  }

  private async handleListingExpiryWarnings() {
    const now = new Date();

    // Find approved listings between day 20 and day 29 (before sold-check kicks in)
    const approvedListings = await this.prisma.listing.findMany({
      where: {
        status: ListingStatus.APPROVED,
        postedAt: { not: null },
      },
      select: { id: true, ownerId: true, title: true, postedAt: true },
    });

    const warningIds: string[] = [];
    for (const listing of approvedListings) {
      if (!listing.postedAt) continue;
      const daysLive = Math.floor(
        (now.getTime() - listing.postedAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      // Warn on day 20 and 25 only (day 30+ is handled by sold-check)
      if (daysLive >= 20 && daysLive < SOLD_CHECK_START_DAY && daysLive % 5 === 0) {
        warningIds.push(listing.id);
        const daysLeft = SOLD_CHECK_START_DAY - daysLive;
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
                body: `إعلانك "${listing.title}" سينتهي خلال ${daysLeft} أيام. هل تم البيع؟`,
                metadata: { listingId: listing.id, daysLive, daysLeft },
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

  /**
   * Sold-check flow (starts at day 30):
   * - Every 5 days from day 30, sends a "هل تم بيع سيارتك؟" notification
   * - Owner can reply via API (sold → SOLD, not sold → resets check)
   * - After SOLD_CHECK_MAX_UNANSWERED unanswered checks → listing auto-expires
   */
  private async handleSoldCheck() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch all APPROVED listings that have been posted for 30+ days
    const startCutoff = new Date(now.getTime() - SOLD_CHECK_START_DAY * 24 * 60 * 60 * 1000);
    const listings = await this.prisma.listing.findMany({
      where: {
        status: ListingStatus.APPROVED,
        postedAt: { lte: startCutoff },
      },
      select: {
        id: true,
        ownerId: true,
        title: true,
        postedAt: true,
        soldCheckCount: true,
        lastSoldCheckAt: true,
      },
    });

    let checkedCount = 0;
    let autoExpiredCount = 0;

    for (const listing of listings) {
      if (!listing.postedAt) continue;

      const daysLive = Math.floor(
        (now.getTime() - listing.postedAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Determine if it's time to send the next check
      // First check: exactly on day 30. Subsequent: every 5 days after lastSoldCheckAt
      const isFirstCheck = listing.soldCheckCount === 0;
      const daysSinceLastCheck = listing.lastSoldCheckAt
        ? Math.floor((now.getTime() - listing.lastSoldCheckAt.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const shouldSendCheck = isFirstCheck
        ? daysLive >= SOLD_CHECK_START_DAY
        : daysSinceLastCheck !== null && daysSinceLastCheck >= SOLD_CHECK_INTERVAL_DAYS;

      if (!shouldSendCheck) continue;

      // Auto-expire if already sent max unanswered checks
      if (listing.soldCheckCount >= SOLD_CHECK_MAX_UNANSWERED) {
        await this.prisma.listing.update({
          where: { id: listing.id },
          data: { status: ListingStatus.EXPIRED },
        });

        // Notify owner of auto-expiry
        await this.prisma.notification
          .create({
            data: {
              userId: listing.ownerId,
              type: NotificationType.LISTING_EXPIRY_WARNING,
              title: 'تم إيقاف إعلانك تلقائياً',
              body: `إعلانك "${listing.title}" تم إيقافه تلقائياً لعدم الرد على استفسارات البيع. يمكنك إعادة نشره في أي وقت.`,
              metadata: {
                listingId: listing.id,
                reason: 'no_sold_response',
                soldCheckCount: listing.soldCheckCount,
              },
              isRead: false,
            },
          })
          .catch(() => {});

        autoExpiredCount++;
        continue;
      }

      // Guard against duplicate same-day check for the same listing
      const alreadySentToday = await this.prisma.notification.findFirst({
        where: {
          userId: listing.ownerId,
          type: NotificationType.LISTING_SOLD_CHECK,
          createdAt: { gte: todayStart },
          metadata: { path: ['listingId'], equals: listing.id },
        },
      });

      if (alreadySentToday) continue;

      const checkNumber = listing.soldCheckCount + 1;
      const remaining = SOLD_CHECK_MAX_UNANSWERED - checkNumber;

      // Send sold-check notification
      await this.prisma.notification
        .create({
          data: {
            userId: listing.ownerId,
            type: NotificationType.LISTING_SOLD_CHECK,
            title: 'هل تم بيع سيارتك؟',
            body:
              remaining > 0
                ? `إعلانك "${listing.title}" مفعّل منذ ${daysLive} يوماً. هل تم البيع؟ إذا لم تُجب سيتم إيقاف الإعلان بعد ${remaining} ${remaining === 1 ? 'تنبيه' : 'تنبيهات'} إضافية.`
                : `إعلانك "${listing.title}" — هذا آخر تنبيه. إذا لم تُجب سيتم إيقاف الإعلان تلقائياً.`,
            metadata: {
              listingId: listing.id,
              daysLive,
              checkNumber,
              remainingChecks: remaining,
            },
            isRead: false,
          },
        })
        .catch(() => {});

      // Increment soldCheckCount and update lastSoldCheckAt
      await this.prisma.listing.update({
        where: { id: listing.id },
        data: {
          soldCheckCount: { increment: 1 },
          lastSoldCheckAt: now,
        },
      });

      checkedCount++;
    }

    if (checkedCount > 0) {
      this.logger.log(`Sent sold-check notifications for ${checkedCount} listings.`);
    }
    if (autoExpiredCount > 0) {
      this.logger.log(`Auto-expired ${autoExpiredCount} listings due to no sold response.`);
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
