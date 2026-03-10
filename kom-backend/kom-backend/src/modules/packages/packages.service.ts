import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole, SubscriptionStatus, IndividualPurchaseStatus } from '@prisma/client';
import {
  CreatePackageDto,
  UpdatePackageDto,
  SubscribeDto,
  CreateIndividualPackageDto,
  UpdateIndividualPackageDto,
  PurchaseIndividualPackageDto,
} from './dto';

// Multiplier map: durationChoice → how many base periods
const DURATION_MULTIPLIER: Record<string, number> = {
  '1': 1,
  '3': 3,
  '6': 6,
  '12': 12,
};

@Injectable()
export class PackagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ═══════════════════════════════════════════════════════════
  // PUBLIC
  // ═══════════════════════════════════════════════════════════

  /** Merchant subscription packages (shown in app for showroom users) */
  async getActivePackages() {
    return this.prisma.subscriptionPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /** Individual listing packages (shown in app for individual users) */
  async getActiveIndividualPackages() {
    return this.prisma.individualListingPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // MERCHANT (USER_SHOWROOM)
  // ═══════════════════════════════════════════════════════════

  async getMySubscription(userId: string) {
    return this.prisma.subscription.findUnique({
      where: { userId },
      include: { package: true },
    });
  }

  async subscribe(userId: string, dto: SubscribeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== UserRole.USER_SHOWROOM) {
      throw new ForbiddenException('فقط حسابات المعارض يمكنها الاشتراك في الباقات');
    }

    const pkg = await this.prisma.subscriptionPackage.findUnique({
      where: { id: dto.packageId },
    });
    if (!pkg || !pkg.isActive) {
      throw new NotFoundException('الباقة غير موجودة أو غير نشطة');
    }

    // Resolve price and duration based on durationChoice
    const multiplier = DURATION_MULTIPLIER[dto.durationChoice] ?? 1;
    const totalDays = (pkg.durationDays ?? 30) * multiplier;

    let paidAmount: number;
    if (dto.durationChoice === '3') {
      if (!pkg.price3Months) throw new BadRequestException('هذه الباقة لا تدعم الاشتراك لـ 3 أشهر');
      paidAmount = Number(pkg.price3Months);
    } else if (dto.durationChoice === '6') {
      if (!pkg.price6Months) throw new BadRequestException('هذه الباقة لا تدعم الاشتراك لـ 6 أشهر');
      paidAmount = Number(pkg.price6Months);
    } else if (dto.durationChoice === '12') {
      if (!pkg.price12Months)
        throw new BadRequestException('هذه الباقة لا تدعم الاشتراك لسنة كاملة');
      paidAmount = Number(pkg.price12Months);
    } else {
      paidAmount = Number(pkg.priceMonthly);
    }

    const existing = await this.prisma.subscription.findUnique({ where: { userId } });
    if (existing && existing.status === SubscriptionStatus.ACTIVE) {
      const now = new Date();
      if (existing.endDate > now) {
        throw new BadRequestException(
          'لديك اشتراك نشط بالفعل. يمكنك التجديد أو تغيير الباقة بعد انتهائه.',
        );
      }
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + totalDays);

    return this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        packageId: dto.packageId,
        status: SubscriptionStatus.ACTIVE,
        durationChoice: dto.durationChoice,
        startDate: now,
        endDate,
        listingsUsed: 0,
        paidAmount,
      },
      update: {
        packageId: dto.packageId,
        status: SubscriptionStatus.ACTIVE,
        durationChoice: dto.durationChoice,
        startDate: now,
        endDate,
        listingsUsed: 0,
        paidAmount,
      },
      include: { package: true },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // INDIVIDUAL (USER_INDIVIDUAL)
  // ═══════════════════════════════════════════════════════════

  /** Returns all active credit bundles owned by an individual */
  async getMyIndividualPurchases(userId: string) {
    return this.prisma.individualPurchase.findMany({
      where: { userId, status: IndividualPurchaseStatus.ACTIVE },
      include: { package: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Individual buys a listing credit package */
  async purchaseIndividualPackage(userId: string, dto: PurchaseIndividualPackageDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== UserRole.USER_INDIVIDUAL) {
      throw new ForbiddenException('فقط الحسابات الفردية يمكنها شراء باقات الإعلانات الفردية');
    }

    const pkg = await this.prisma.individualListingPackage.findUnique({
      where: { id: dto.packageId },
    });
    if (!pkg || !pkg.isActive) {
      throw new NotFoundException('الباقة غير موجودة أو غير نشطة');
    }

    return this.prisma.individualPurchase.create({
      data: {
        userId,
        packageId: dto.packageId,
        creditsTotal: pkg.listingCount,
        creditsUsed: 0,
        paidAmount: pkg.price,
        status: IndividualPurchaseStatus.ACTIVE,
      },
      include: { package: true },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // ADMIN — Merchant packages
  // ═══════════════════════════════════════════════════════════

  async getAllPackages() {
    return this.prisma.subscriptionPackage.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { subscriptions: true } } },
    });
  }

  async createPackage(dto: CreatePackageDto) {
    return this.prisma.subscriptionPackage.create({
      data: {
        name: dto.name,
        description: dto.description,
        priceMonthly: dto.priceMonthly,
        price3Months: dto.price3Months,
        price6Months: dto.price6Months,
        price12Months: dto.price12Months,
        discountNote: dto.discountNote,
        maxListings: dto.maxListings,
        maxStories: dto.maxStories ?? 3,
        durationDays: dto.durationDays ?? 30,
        sortOrder: dto.sortOrder ?? 0,
        isActive: true,
      },
    });
  }

  async updatePackage(packageId: string, dto: UpdatePackageDto) {
    const pkg = await this.prisma.subscriptionPackage.findUnique({ where: { id: packageId } });
    if (!pkg) throw new NotFoundException('الباقة غير موجودة');

    return this.prisma.subscriptionPackage.update({
      where: { id: packageId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.priceMonthly !== undefined && { priceMonthly: dto.priceMonthly }),
        ...(dto.price3Months !== undefined && { price3Months: dto.price3Months }),
        ...(dto.price6Months !== undefined && { price6Months: dto.price6Months }),
        ...(dto.price12Months !== undefined && { price12Months: dto.price12Months }),
        ...(dto.discountNote !== undefined && { discountNote: dto.discountNote }),
        ...(dto.maxListings !== undefined && { maxListings: dto.maxListings }),
        ...(dto.maxStories !== undefined && { maxStories: dto.maxStories }),
        ...(dto.durationDays !== undefined && { durationDays: dto.durationDays }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async deletePackage(packageId: string) {
    const pkg = await this.prisma.subscriptionPackage.findUnique({
      where: { id: packageId },
      include: { _count: { select: { subscriptions: true } } },
    });
    if (!pkg) throw new NotFoundException('الباقة غير موجودة');

    if (pkg._count.subscriptions > 0) {
      return this.prisma.subscriptionPackage.update({
        where: { id: packageId },
        data: { isActive: false },
      });
    }

    return this.prisma.subscriptionPackage.delete({ where: { id: packageId } });
  }

  // ═══════════════════════════════════════════════════════════
  // ADMIN — Individual packages
  // ═══════════════════════════════════════════════════════════

  async getAllIndividualPackages() {
    return this.prisma.individualListingPackage.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { purchases: true } } },
    });
  }

  async createIndividualPackage(dto: CreateIndividualPackageDto) {
    return this.prisma.individualListingPackage.create({
      data: {
        name: dto.name,
        description: dto.description,
        listingCount: dto.listingCount,
        maxStories: dto.maxStories ?? 2,
        price: dto.price,
        sortOrder: dto.sortOrder ?? 0,
        isActive: true,
      },
    });
  }

  async updateIndividualPackage(packageId: string, dto: UpdateIndividualPackageDto) {
    const pkg = await this.prisma.individualListingPackage.findUnique({ where: { id: packageId } });
    if (!pkg) throw new NotFoundException('الباقة غير موجودة');

    return this.prisma.individualListingPackage.update({
      where: { id: packageId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.listingCount !== undefined && { listingCount: dto.listingCount }),
        ...(dto.maxStories !== undefined && { maxStories: dto.maxStories }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async deleteIndividualPackage(packageId: string) {
    const pkg = await this.prisma.individualListingPackage.findUnique({
      where: { id: packageId },
      include: { _count: { select: { purchases: true } } },
    });
    if (!pkg) throw new NotFoundException('الباقة غير موجودة');

    if (pkg._count.purchases > 0) {
      return this.prisma.individualListingPackage.update({
        where: { id: packageId },
        data: { isActive: false },
      });
    }

    return this.prisma.individualListingPackage.delete({ where: { id: packageId } });
  }

  // ═══════════════════════════════════════════════════════════
  // HELPERS — used by listings.service.ts
  // ═══════════════════════════════════════════════════════════

  /** Check if a SHOWROOM merchant can post a new listing */
  async canMerchantPost(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { package: true },
    });

    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
      return { allowed: false, reason: 'لا يوجد اشتراك نشط. يرجى الاشتراك في إحدى الباقات.' };
    }

    const now = new Date();
    if (subscription.endDate <= now) {
      return { allowed: false, reason: 'انتهى اشتراكك. يرجى تجديد الاشتراك.' };
    }

    if (subscription.listingsUsed >= subscription.package.maxListings) {
      return {
        allowed: false,
        reason: `لقد وصلت إلى الحد الأقصى من الإعلانات (${subscription.package.maxListings}) لباقتك الحالية.`,
      };
    }

    return { allowed: true };
  }

  /** Check if an INDIVIDUAL user has remaining listing credits */
  async canIndividualPost(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    // Find the oldest active purchase with remaining credits (FIFO)
    const purchase = await this.prisma.individualPurchase.findFirst({
      where: {
        userId,
        status: IndividualPurchaseStatus.ACTIVE,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!purchase) {
      return {
        allowed: false,
        reason: 'لا يوجد رصيد إعلانات. يرجى شراء باقة من قسم الباقات الفردية.',
      };
    }

    const remaining = purchase.creditsTotal - purchase.creditsUsed;
    if (remaining <= 0) {
      return {
        allowed: false,
        reason: 'لا يوجد رصيد إعلانات. يرجى شراء باقة إضافية.',
      };
    }

    return { allowed: true };
  }

  /** Deduct one listing credit from the oldest active purchase (FIFO) */
  async incrementIndividualCreditsUsed(userId: string) {
    const purchase = await this.prisma.individualPurchase.findFirst({
      where: { userId, status: IndividualPurchaseStatus.ACTIVE },
      orderBy: { createdAt: 'asc' },
    });

    if (!purchase) return;

    const newUsed = purchase.creditsUsed + 1;

    if (newUsed >= purchase.creditsTotal) {
      // Exhaust this purchase bundle
      await this.prisma.individualPurchase.update({
        where: { id: purchase.id },
        data: {
          creditsUsed: newUsed,
          status: IndividualPurchaseStatus.EXHAUSTED,
        },
      });
    } else {
      await this.prisma.individualPurchase.update({
        where: { id: purchase.id },
        data: { creditsUsed: newUsed },
      });
    }
  }

  /** Deduct one listing from merchant's listingsUsed counter */
  async incrementListingsUsed(userId: string) {
    await this.prisma.subscription.updateMany({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      data: { listingsUsed: { increment: 1 } },
    });
  }
}
