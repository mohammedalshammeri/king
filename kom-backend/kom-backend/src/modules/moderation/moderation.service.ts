import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PackagesService } from '../packages/packages.service';
import { EmailService } from '../email/email.service';
import { ListingStatus, Prisma, UserRole } from '@prisma/client';
import { PaginatedResponse } from '../../common/dto';
import { PendingListingsQueryDto, RejectListingDto, AcceptedListingsQueryDto } from './dto';

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly packagesService: PackagesService,
    private readonly emailService: EmailService,
  ) {}

  async getPendingListings(query: PendingListingsQueryDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.PENDING_REVIEW,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.ownerType) {
      where.ownerType = query.ownerType;
    }

    if (query.dateFrom) {
      where.postedAt = { gte: new Date(query.dateFrom) };
    }

    if (query.dateTo) {
      where.postedAt = {
        ...(where.postedAt as Prisma.DateTimeFilter),
        lte: new Date(query.dateTo),
      };
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: {
          media: { orderBy: { sortOrder: 'asc' }, take: 1 },
          carDetails: true,
          plateDetails: true,
          partDetails: true,
          owner: {
            select: {
              id: true,
              email: true,
              phone: true,
              role: true,
              isActive: true,
              isBanned: true,
              createdAt: true,
              individualProfile: { select: { fullName: true } },
              showroomProfile: { select: { showroomName: true } },
            },
          },
        },
        orderBy: { postedAt: 'asc' }, // Oldest first for FIFO
        skip,
        take: limit,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return new PaginatedResponse(listings, total, page, limit);
  }

  async getAcceptedListings(query: AcceptedListingsQueryDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      status: { in: [ListingStatus.APPROVED, ListingStatus.EXPIRED] },
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { id: { contains: query.search } },
      ];
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: {
          media: { orderBy: { sortOrder: 'asc' }, take: 1 },
          carDetails: true,
          plateDetails: true,
          partDetails: true,
          owner: {
            select: {
              id: true,
              email: true,
              phone: true,
              role: true,
              isActive: true,
              isBanned: true,
              createdAt: true,
              individualProfile: { select: { fullName: true } },
              showroomProfile: { select: { showroomName: true } },
            },
          },
        },
        orderBy: { postedAt: 'desc' }, // Newest first
        skip,
        take: limit,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return new PaginatedResponse(listings, total, page, limit);
  }

  async getListingForReview(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        carDetails: true,
        plateDetails: true,
        partDetails: true,
        paymentTransactions: true,
        owner: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            isBanned: true,
            createdAt: true,
            lastLoginAt: true,
            individualProfile: true,
            showroomProfile: {
              include: { contactPhones: true },
            },
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Get owner's other listings count
    const ownerListingsCount = await this.prisma.listing.count({
      where: { ownerId: listing.ownerId },
    });

    const ownerApprovedCount = await this.prisma.listing.count({
      where: {
        ownerId: listing.ownerId,
        status: ListingStatus.APPROVED,
      },
    });

    return {
      ...listing,
      ownerStats: {
        totalListings: ownerListingsCount,
        approvedListings: ownerApprovedCount,
      },
    };
  }

  async approveListing(listingId: string, adminId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.status !== ListingStatus.PENDING_REVIEW) {
      throw new BadRequestException('Listing is not pending review');
    }

    // Get before state for audit log
    const beforeState = { status: listing.status };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    // Approve listing
    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: ListingStatus.APPROVED,
        approvedAt: new Date(),
        expiresAt: expiresAt,
        rejectedAt: null,
        rejectionReason: null,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'LISTING_APPROVED',
        entityType: 'Listing',
        entityId: listingId,
        before: beforeState,
        after: { status: ListingStatus.APPROVED },
      },
    });

    // Notify owner
    await this.notificationsService.notifyListingApproved(
      listing.ownerId,
      listing.id,
      listing.title,
    );

    // Also nudge owner to feature their listing
    this.notificationsService
      .notifyFeatureListing(listing.ownerId, listing.id, listing.title)
      .catch(() => {});

    // Send approval email
    const ownerUser = await this.prisma.user.findUnique({
      where: { id: listing.ownerId },
      select: { email: true },
    });
    if (ownerUser?.email) {
      this.emailService
        .sendListingApproved(ownerUser.email, listing.title, listing.id)
        .catch(() => {});
    }

    // If owner is a showroom merchant, increment their subscription listings used counter
    const owner = await this.prisma.user.findUnique({
      where: { id: listing.ownerId },
      select: { role: true },
    });
    if (owner?.role === UserRole.USER_SHOWROOM) {
      await this.packagesService.incrementListingsUsed(listing.ownerId);
    }

    return updated;
  }

  async rejectListing(listingId: string, adminId: string, dto: RejectListingDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.status !== ListingStatus.PENDING_REVIEW) {
      throw new BadRequestException('Listing is not pending review');
    }

    // Get before state for audit log
    const beforeState = { status: listing.status };

    // Reject listing
    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: ListingStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: dto.reason,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'LISTING_REJECTED',
        entityType: 'Listing',
        entityId: listingId,
        before: beforeState,
        after: { status: ListingStatus.REJECTED, reason: dto.reason },
      },
    });

    // Notify owner
    await this.notificationsService.notifyListingRejected(
      listing.ownerId,
      listing.id,
      listing.title,
      dto.reason,
    );

    // Send rejection email
    const ownerUser = await this.prisma.user.findUnique({
      where: { id: listing.ownerId },
      select: { email: true },
    });
    if (ownerUser?.email) {
      this.emailService
        .sendListingRejected(ownerUser.email, listing.title, dto.reason)
        .catch(() => {});
    }

    return updated;
  }

  async reactivateListing(listingId: string, adminId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Reset for another 30 days

    // Reactivate listing
    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: ListingStatus.APPROVED,
        expiresAt: expiresAt,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'LISTING_REACTIVATED',
        entityType: 'Listing',
        entityId: listingId,
        before: { status: listing.status, expiresAt: listing.expiresAt },
        after: { status: ListingStatus.APPROVED, expiresAt: expiresAt },
      },
    });

    return updated;
  }

  async getRecentModerationActivity(adminId: string, limit: number = 20) {
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        actorId: adminId,
        action: { in: ['LISTING_APPROVED', 'LISTING_REJECTED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return auditLogs;
  }

  async getModerationStats() {
    const [pendingCount, approvedToday, rejectedToday, _totalPending] = await Promise.all([
      this.prisma.listing.count({
        where: { status: ListingStatus.PENDING_REVIEW },
      }),
      this.prisma.listing.count({
        where: {
          status: ListingStatus.APPROVED,
          approvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.listing.count({
        where: {
          status: ListingStatus.REJECTED,
          rejectedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.listing.count({
        where: { status: ListingStatus.PENDING_REVIEW },
      }),
    ]);

    // Get pending by type
    const pendingByType = await this.prisma.listing.groupBy({
      by: ['type'],
      where: { status: ListingStatus.PENDING_REVIEW },
      _count: true,
    });

    return {
      pendingCount,
      approvedToday,
      rejectedToday,
      pendingByType: pendingByType.map((p) => ({
        type: p.type,
        count: p._count,
      })),
    };
  }
}
