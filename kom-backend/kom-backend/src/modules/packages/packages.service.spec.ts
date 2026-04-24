import {
  IndividualPurchaseStatus,
  ListingStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { PackagesService } from './packages.service';

describe('PackagesService', () => {
  const createService = () => {
    const prisma = {
      subscription: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      listing: {
        count: jest.fn(),
      },
      individualPurchase: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
    } as any;

    const service = new PackagesService(prisma, {} as any);

    return { service, prisma };
  };

  it('blocks showroom posting when active and pending listings already reach package limit', async () => {
    const { service, prisma } = createService();

    prisma.subscription.findUnique.mockResolvedValue({
      userId: 'showroom-1',
      status: SubscriptionStatus.ACTIVE,
      endDate: new Date('2026-05-01T00:00:00.000Z'),
      listingsUsed: 0,
      package: { maxListings: 3 },
    });
    prisma.listing.count.mockResolvedValue(3);

    const result = await service.canMerchantPost('showroom-1');

    expect(result).toEqual({
      allowed: false,
      reason: 'لقد وصلت إلى الحد الأقصى من الإعلانات (3) لباقتك الحالية.',
    });
    expect(prisma.listing.count).toHaveBeenCalledWith({
      where: {
        ownerId: 'showroom-1',
        status: { in: [ListingStatus.PENDING_REVIEW, ListingStatus.APPROVED] },
      },
    });
  });

  it('allows individual posting when an older bundle is exhausted but a later one still has credits', async () => {
    const { service, prisma } = createService();

    prisma.individualPurchase.findMany.mockResolvedValue([
      {
        id: 'bundle-1',
        userId: 'individual-1',
        creditsTotal: 2,
        creditsUsed: 2,
        status: IndividualPurchaseStatus.ACTIVE,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 'bundle-2',
        userId: 'individual-1',
        creditsTotal: 5,
        creditsUsed: 1,
        status: IndividualPurchaseStatus.ACTIVE,
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    ]);

    const result = await service.canIndividualPost('individual-1');

    expect(result).toEqual({ allowed: true });
  });

  it('deducts an individual credit from the oldest bundle that still has remaining credits', async () => {
    const { service, prisma } = createService();

    prisma.individualPurchase.findMany.mockResolvedValue([
      {
        id: 'bundle-1',
        userId: 'individual-1',
        creditsTotal: 2,
        creditsUsed: 2,
        status: IndividualPurchaseStatus.ACTIVE,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 'bundle-2',
        userId: 'individual-1',
        creditsTotal: 5,
        creditsUsed: 1,
        status: IndividualPurchaseStatus.ACTIVE,
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    ]);

    await service.incrementIndividualCreditsUsed('individual-1');

    expect(prisma.individualPurchase.update).toHaveBeenCalledWith({
      where: { id: 'bundle-2' },
      data: { creditsUsed: 2 },
    });
  });
});