import { ListingStatus, UserRole } from '@prisma/client';
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

  it('approves a pending showroom listing and increments package usage', async () => {
    const { service, prisma, notificationsService, packagesService, emailService } = createService();

    prisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      ownerId: 'owner-1',
      title: 'BMW',
      status: ListingStatus.PENDING_REVIEW,
    });
    prisma.listing.update.mockResolvedValue({ id: 'listing-1', status: ListingStatus.APPROVED });
    prisma.user.findUnique
      .mockResolvedValueOnce({ email: 'owner@example.com' })
      .mockResolvedValueOnce({ role: UserRole.USER_SHOWROOM });

    const result = await service.approveListing('listing-1', 'admin-1');

    expect(result).toEqual({ id: 'listing-1', status: ListingStatus.APPROVED });
    expect(prisma.auditLog.create).toHaveBeenCalled();
    expect(notificationsService.notifyListingApproved).toHaveBeenCalledWith(
      'owner-1',
      'listing-1',
      'BMW',
    );
    expect(packagesService.incrementListingsUsed).toHaveBeenCalledWith('owner-1');
    expect(emailService.sendListingApproved).toHaveBeenCalledWith(
      'owner@example.com',
      'BMW',
      'listing-1',
    );
  });
});