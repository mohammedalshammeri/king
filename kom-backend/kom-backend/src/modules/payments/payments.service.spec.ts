import { ForbiddenException } from '@nestjs/common';
import { PaymentStatus, UserRole } from '@prisma/client';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const createService = () => {
    const prisma = {
      user: { findUnique: jest.fn() },
      subscriptionPackage: { findUnique: jest.fn() },
      paymentTransaction: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      systemSetting: { findUnique: jest.fn() },
    } as any;

    const service = new PaymentsService(
      prisma,
      { get: jest.fn((key: string) => (key === 'payment.listingFeeBhd' ? 3 : undefined)) } as any,
      { notifyAdmins: jest.fn() } as any,
      {} as any,
      {} as any,
    );

    return { service, prisma };
  };

  it('blocks showroom subscriptions for non-showroom users', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: UserRole.USER_INDIVIDUAL });

    await expect(
      service.initiateSubscriptionPayment('user-1', { packageId: 'pkg-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns an existing pending subscription payment instead of creating a new one', async () => {
    const { service, prisma } = createService();

    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: UserRole.USER_SHOWROOM });
    prisma.subscriptionPackage.findUnique.mockResolvedValue({
      id: 'pkg-1',
      isActive: true,
      name: 'Gold',
      priceMonthly: 10,
      durationDays: 30,
    });
    prisma.paymentTransaction.findFirst.mockResolvedValue({
      id: 'tx-1',
      status: PaymentStatus.PENDING,
    });
    prisma.systemSetting.findUnique.mockResolvedValue(null);

    const result = await service.initiateSubscriptionPayment('user-1', { packageId: 'pkg-1' });

    expect(prisma.paymentTransaction.create).not.toHaveBeenCalled();
    expect(result.transaction).toEqual({ id: 'tx-1', status: PaymentStatus.PENDING });
    expect(result.iban).toBe('BH00XXXX0000000000000000');
  });
});