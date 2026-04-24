import { ForbiddenException } from '@nestjs/common';
import { PaymentStatus, SubscriptionStatus, UserRole } from '@prisma/client';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const createService = () => {
    const prisma = {
      user: { findUnique: jest.fn() },
      subscriptionPackage: { findUnique: jest.fn() },
      subscription: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      paymentTransaction: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      systemSetting: { findUnique: jest.fn() },
    } as any;

    const notificationsService = {
      notifyAdmins: jest.fn(),
      createNotification: jest.fn().mockResolvedValue(undefined),
    } as any;

    const emailService = {
      sendPaymentConfirmed: jest.fn().mockResolvedValue(undefined),
      sendPaymentRejected: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new PaymentsService(
      prisma,
      { get: jest.fn((key: string) => (key === 'payment.listingFeeBhd' ? 3 : undefined)) } as any,
      notificationsService,
      {} as any,
      {} as any,
      emailService,
    );

    return { service, prisma, notificationsService, emailService };
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-17T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

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

  it('activates subscription payments with the stored duration choice', async () => {
    const { service, prisma, notificationsService, emailService } = createService();

    prisma.paymentTransaction.findUnique.mockResolvedValue({
      id: 'tx-approve-1',
      userId: 'showroom-1',
      subscriptionId: 'pkg-1',
      paymentType: 'SUBSCRIPTION',
      amount: 45,
      status: PaymentStatus.PENDING_PROOF,
      metadata: { durationChoice: '3', durationDays: 90, packageName: 'Gold 3M' },
    });
    prisma.paymentTransaction.update.mockResolvedValue({
      id: 'tx-approve-1',
      status: PaymentStatus.PAID,
    });
    prisma.user.findUnique.mockResolvedValue({ email: 'owner@example.com' });
    prisma.subscriptionPackage.findUnique.mockResolvedValue({
      id: 'pkg-1',
      name: 'Gold',
      priceMonthly: 20,
      durationDays: 30,
    });
    prisma.subscription.findUnique.mockResolvedValue(null);
    prisma.subscription.upsert.mockResolvedValue({ id: 'sub-1' });

    await service.reviewPayment('admin-1', 'tx-approve-1', { action: 'APPROVE' });

    expect(prisma.subscription.upsert).toHaveBeenCalled();
    const upsertArgs = prisma.subscription.upsert.mock.calls[0][0];
    expect(upsertArgs.create.durationChoice).toBe('3');
    expect(upsertArgs.update.durationChoice).toBe('3');
    expect(upsertArgs.create.startDate).toEqual(new Date('2026-04-17T00:00:00.000Z'));
    expect(upsertArgs.create.endDate).toEqual(new Date('2026-07-16T00:00:00.000Z'));
    expect(notificationsService.createNotification).toHaveBeenCalled();
    expect(emailService.sendPaymentConfirmed).toHaveBeenCalledWith(
      'owner@example.com',
      'Gold 3M',
      45,
    );
  });

  it('extends an active showroom subscription from its current end date when renewed early', async () => {
    const { service, prisma } = createService();

    prisma.paymentTransaction.findUnique.mockResolvedValue({
      id: 'tx-approve-2',
      userId: 'showroom-1',
      subscriptionId: 'pkg-1',
      paymentType: 'SUBSCRIPTION',
      amount: 20,
      status: PaymentStatus.PENDING_PROOF,
      metadata: { durationChoice: '1', durationDays: 30, packageName: 'Gold 1M' },
    });
    prisma.paymentTransaction.update.mockResolvedValue({
      id: 'tx-approve-2',
      status: PaymentStatus.PAID,
    });
    prisma.user.findUnique.mockResolvedValue({ email: 'owner@example.com' });
    prisma.subscriptionPackage.findUnique.mockResolvedValue({
      id: 'pkg-1',
      name: 'Gold',
      priceMonthly: 20,
      durationDays: 30,
    });
    prisma.subscription.findUnique.mockResolvedValue({
      id: 'sub-1',
      status: SubscriptionStatus.ACTIVE,
      endDate: new Date('2026-05-10T00:00:00.000Z'),
    });
    prisma.subscription.upsert.mockResolvedValue({ id: 'sub-1' });

    await service.reviewPayment('admin-1', 'tx-approve-2', { action: 'APPROVE' });

    const upsertArgs = prisma.subscription.upsert.mock.calls[0][0];
    expect(upsertArgs.update.endDate).toEqual(new Date('2026-06-09T00:00:00.000Z'));
  });
});