import { ListingStatus } from '@prisma/client';
import { ModerationService } from './moderation.service';

describe('ModerationService', () => {
  const createService = () => {
    const prisma = {
      listing: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    } as any;

    const notificationsService = {
      notifyListingApproved: jest.fn(),
      notifyFeatureListing: jest.fn().mockResolvedValue(undefined),
    } as any;

    const packagesService = {
      incrementListingsUsed: jest.fn(),
    } as any;

    const emailService = {
      sendListingApproved: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new ModerationService(
      prisma,
      notificationsService,
      packagesService,
      emailService,
    );

    return { service, prisma, notificationsService, packagesService, emailService };
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-17T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('approves a pending showroom listing and sets a fresh 30-day lifetime without double counting usage', async () => {
    const { service, prisma, notificationsService, packagesService, emailService } = createService();

    prisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      ownerId: 'owner-1',
      title: 'BMW',
      status: ListingStatus.PENDING_REVIEW,
    });
    prisma.listing.update.mockResolvedValue({ id: 'listing-1', status: ListingStatus.APPROVED });
    prisma.user.findUnique.mockResolvedValueOnce({ email: 'owner@example.com' });

    const result = await service.approveListing('listing-1', 'admin-1');

    expect(result).toEqual({ id: 'listing-1', status: ListingStatus.APPROVED });
    expect(prisma.listing.update).toHaveBeenCalledWith({
      where: { id: 'listing-1' },
      data: {
        status: ListingStatus.APPROVED,
        approvedAt: new Date('2026-04-17T00:00:00.000Z'),
        postedAt: new Date('2026-04-17T00:00:00.000Z'),
        expiresAt: new Date('2026-05-17T00:00:00.000Z'),
        rejectedAt: null,
        rejectionReason: null,
        soldCheckCount: 0,
        lastSoldCheckAt: null,
      },
    });
    expect(prisma.auditLog.create).toHaveBeenCalled();
    expect(notificationsService.notifyListingApproved).toHaveBeenCalledWith(
      'owner-1',
      'listing-1',
      'BMW',
    );
    expect(packagesService.incrementListingsUsed).not.toHaveBeenCalled();
    expect(emailService.sendListingApproved).toHaveBeenCalledWith(
      'owner@example.com',
      'BMW',
      'listing-1',
    );
  });
});