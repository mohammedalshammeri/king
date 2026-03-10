import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

/** Generate a 3-digit code where all digits are different (e.g. "3-7-2") */
function generateLuckCode(): string {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  // Fisher-Yates shuffle
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  // Take first 3 (guaranteed unique digits)
  return `${digits[0]}-${digits[1]}-${digits[2]}`;
}

@Injectable()
export class LuckService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Get or create the single LuckFeature config row */
  private async getOrCreateFeature() {
    let feature = await this.prisma.luckFeature.findFirst();
    if (!feature) {
      feature = await this.prisma.luckFeature.create({ data: {} });
    }
    return feature;
  }

  /** Public: current status + winner info */
  async getStatus() {
    const feature = await this.getOrCreateFeature();

    let winner = null;
    if (feature.winnerId && feature.winnerCode) {
      const entry = await this.prisma.luckEntry.findUnique({
        where: { userId: feature.winnerId },
        include: {
          user: {
            select: {
              individualProfile: { select: { fullName: true } },
              showroomProfile: { select: { showroomName: true } },
            },
          },
        },
      });
      if (entry) {
        winner = {
          code: feature.winnerCode,
          userName:
            entry.user.individualProfile?.fullName ??
            entry.user.showroomProfile?.showroomName ??
            'مستخدم',
          drawnAt: feature.drawnAt,
        };
      }
    }

    return {
      isEnabled: feature.isEnabled,
      winner,
    };
  }

  /** Authenticated user: get their own luck code */
  async getMyEntry(userId: string) {
    const feature = await this.getOrCreateFeature();
    const entry = await this.prisma.luckEntry.findUnique({ where: { userId } });

    return {
      isEnabled: feature.isEnabled,
      myCode: entry ? entry.code : null,
      isWinner: entry ? entry.isWinner : false,
      winner: feature.winnerCode
        ? { code: feature.winnerCode, drawnAt: feature.drawnAt }
        : null,
    };
  }

  /** Admin: toggle feature on/off */
  async toggle() {
    const feature = await this.getOrCreateFeature();
    const updated = await this.prisma.luckFeature.update({
      where: { id: feature.id },
      data: { isEnabled: !feature.isEnabled },
    });
    return {
      isEnabled: updated.isEnabled,
      message: updated.isEnabled
        ? 'تم تفعيل ميزة الحظ — ستُوزَّع أكواد للمستخدمين الجدد'
        : 'تم إيقاف ميزة الحظ',
    };
  }

  /** Admin: list all entries */
  async getEntries() {
    const feature = await this.getOrCreateFeature();
    const entries = await this.prisma.luckEntry.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
            individualProfile: { select: { fullName: true } },
            showroomProfile: { select: { showroomName: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      totalEntries: entries.length,
      isEnabled: feature.isEnabled,
      winner: feature.winnerCode
        ? { code: feature.winnerCode, drawnAt: feature.drawnAt }
        : null,
      entries: entries.map((e) => ({
        id: e.id,
        code: e.code,
        isWinner: e.isWinner,
        createdAt: e.createdAt,
        user: {
          id: e.user.id,
          email: e.user.email,
          name:
            e.user.individualProfile?.fullName ??
            e.user.showroomProfile?.showroomName ??
            'مستخدم',
          registeredAt: e.user.createdAt,
        },
      })),
    };
  }

  /** Admin: draw a random winner */
  async drawWinner() {
    const feature = await this.getOrCreateFeature();

    if (feature.winnerId) {
      throw new BadRequestException('تم سحب الفائز مسبقاً لا يمكن السحب مرة أخرى');
    }

    const entries = await this.prisma.luckEntry.findMany({
      where: { isWinner: false },
    });

    if (entries.length === 0) {
      throw new BadRequestException('لا يوجد مشتركون في ميزة الحظ بعد');
    }

    // Pick random winner
    const winner = entries[Math.floor(Math.random() * entries.length)];

    await this.prisma.$transaction([
      this.prisma.luckEntry.update({
        where: { id: winner.id },
        data: { isWinner: true },
      }),
      this.prisma.luckFeature.update({
        where: { id: feature.id },
        data: {
          winnerId: winner.userId,
          winnerCode: winner.code,
          drawnAt: new Date(),
          isEnabled: false,
        },
      }),
    ]);

    // Send push notification to winner
    await this.notificationsService.createNotification(
      winner.userId,
      NotificationType.LUCK_WINNER,
      '🎉 مبروك! أنت الفائز!',
      `كودك ${winner.code} هو الكود الفائز! تواصل مع الإدارة للمطالبة بجائزتك.`,
      { code: winner.code },
      true,
    );

    return {
      success: true,
      winner: {
        userId: winner.userId,
        code: winner.code,
      },
      message: `تم السحب بنجاح! الكود الفائز هو: ${winner.code}`,
    };
  }

  /** Called during registration: assign a unique code if feature is active */
  async assignCodeToNewUser(userId: string): Promise<string | null> {
    try {
      const feature = await this.prisma.luckFeature.findFirst();
      if (!feature?.isEnabled) return null;

      // Already has a code?
      const existing = await this.prisma.luckEntry.findUnique({ where: { userId } });
      if (existing) return existing.code;

      // Generate a unique code (max 200 attempts for safety)
      let code = '';
      for (let attempt = 0; attempt < 200; attempt++) {
        const candidate = generateLuckCode();
        const taken = await this.prisma.luckEntry.findUnique({ where: { code: candidate } });
        if (!taken) {
          code = candidate;
          break;
        }
      }

      if (!code) return null;

      await this.prisma.luckEntry.create({ data: { userId, code } });
      return code;
    } catch {
      return null;
    }
  }
}
