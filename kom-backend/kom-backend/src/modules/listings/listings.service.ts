import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ListingType,
  ListingStatus,
  UserRole,
  PaymentStatus,
  Prisma,
  NotificationType,
} from '@prisma/client';
import {
  CreateListingDto,
  UpdateListingDto,
  ListingQueryDto,
  CarDetailsDto,
  PlateDetailsDto,
  PartDetailsDto,
  CreateMotorcycleDetailsDto,
} from './dto';
import { PaginatedResponse } from '../../common/dto';
import { PackagesService } from '../packages/packages.service';

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly packagesService: PackagesService,
  ) {}

  async createListing(userId: string, dto: CreateListingDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Map user role to owner type
    const ownerType =
      user.role === UserRole.USER_SHOWROOM ? UserRole.USER_SHOWROOM : UserRole.USER_INDIVIDUAL;

    const listing = await this.prisma.listing.create({
      data: {
        ownerId: userId,
        ownerType,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        currency: dto.currency || 'BHD',
        locationGovernorate: dto.locationGovernorate,
        locationArea: dto.locationArea,
        contactPreference: dto.contactPreference || 'CALL',
        status: ListingStatus.DRAFT,
      },
      include: {
        media: true,
        carDetails: true,
        motorcycleDetails: true,
        plateDetails: true,
        partDetails: true,
      },
    });

    return listing;
  }

  async updateListing(userId: string, listingId: string, dto: UpdateListingDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.ownerId !== userId) {
      throw new ForbiddenException('You can only edit your own listings');
    }

    // Can only edit DRAFT, REJECTED, or APPROVED listings
    if (
      listing.status !== ListingStatus.DRAFT &&
      listing.status !== ListingStatus.REJECTED &&
      listing.status !== ListingStatus.APPROVED
    ) {
      throw new BadRequestException('Can only edit draft, rejected, or approved listings');
    }

    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price,
        locationGovernorate: dto.locationGovernorate,
        locationArea: dto.locationArea,
        contactPreference: dto.contactPreference,
        // Reset rejection if editing a rejected listing
        rejectionReason: listing.status === ListingStatus.REJECTED ? null : undefined,
        rejectedAt: listing.status === ListingStatus.REJECTED ? null : undefined,
        status:
          listing.status === ListingStatus.REJECTED
            ? ListingStatus.DRAFT
            : listing.status === ListingStatus.APPROVED
              ? ListingStatus.DRAFT
              : undefined,
        approvedAt: listing.status === ListingStatus.APPROVED ? null : undefined,
        postedAt: listing.status === ListingStatus.APPROVED ? null : undefined,
      },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        carDetails: true,
        motorcycleDetails: true,
        plateDetails: true,
        partDetails: true,
      },
    });

    return updated;
  }

  async upsertCarDetails(userId: string, listingId: string, dto: CarDetailsDto) {
    const _listing = await this.validateListingOwnership(userId, listingId, ListingType.CAR);

    const carDetails = await this.prisma.carDetails.upsert({
      where: { listingId },
      create: {
        listingId,
        make: dto.make,
        model: dto.model,
        year: dto.year,
        trim: dto.trim,
        mileageKm: dto.mileageKm,
        transmission: dto.transmission,
        fuel: dto.fuel,
        condition: dto.condition,
        color: dto.color,
        vin: dto.vin,
        bodyType: dto.bodyType,
        engineSize: dto.engineSize,
        specs: dto.specs,
      },
      update: {
        make: dto.make,
        model: dto.model,
        year: dto.year,
        trim: dto.trim,
        mileageKm: dto.mileageKm,
        transmission: dto.transmission,
        fuel: dto.fuel,
        condition: dto.condition,
        color: dto.color,
        vin: dto.vin,
        bodyType: dto.bodyType,
        engineSize: dto.engineSize,
        specs: dto.specs,
      },
    });

    return carDetails;
  }

  async upsertMotorcycleDetails(
    userId: string,
    listingId: string,
    dto: CreateMotorcycleDetailsDto,
  ) {
    const _listing = await this.validateListingOwnership(userId, listingId, ListingType.MOTORCYCLE);

    const motorcycleDetails = await this.prisma.motorcycleDetails.upsert({
      where: { listingId },
      create: {
        listingId,
        make: dto.make,
        model: dto.model,
        year: dto.year,
        mileageKm: dto.mileageKm,
        transmission: dto.transmission,
        condition: dto.condition,
        color: dto.color,
      },
      update: {
        make: dto.make,
        model: dto.model,
        year: dto.year,
        mileageKm: dto.mileageKm,
        transmission: dto.transmission,
        condition: dto.condition,
        color: dto.color,
      },
    });

    return motorcycleDetails;
  }

  async upsertPlateDetails(userId: string, listingId: string, dto: PlateDetailsDto) {
    const _listing = await this.validateListingOwnership(userId, listingId, ListingType.PLATE);

    const plateDetails = await this.prisma.plateDetails.upsert({
      where: { listingId },
      create: {
        listingId,
        plateNumber: dto.plateNumber,
        plateCategory: dto.plateCategory,
        plateCode: dto.plateCode,
        plateType: dto.plateType,
      },
      update: {
        plateNumber: dto.plateNumber,
        plateCategory: dto.plateCategory,
        plateCode: dto.plateCode,
        plateType: dto.plateType,
      },
    });

    return plateDetails;
  }

  async upsertPartDetails(userId: string, listingId: string, dto: PartDetailsDto) {
    const _listing = await this.validateListingOwnership(userId, listingId, ListingType.PART);

    const partDetails = await this.prisma.partDetails.upsert({
      where: { listingId },
      create: {
        listingId,
        partCategory: dto.partCategory,
        partName: dto.partName,
        compatibleCarMake: dto.compatibleCarMake,
        compatibleCarModel: dto.compatibleCarModel,
        compatibleYearFrom: dto.compatibleYearFrom,
        compatibleYearTo: dto.compatibleYearTo,
        condition: dto.condition,
        partNumber: dto.partNumber,
        brand: dto.brand,
      },
      update: {
        partCategory: dto.partCategory,
        partName: dto.partName,
        compatibleCarMake: dto.compatibleCarMake,
        compatibleCarModel: dto.compatibleCarModel,
        compatibleYearFrom: dto.compatibleYearFrom,
        compatibleYearTo: dto.compatibleYearTo,
        condition: dto.condition,
        partNumber: dto.partNumber,
        brand: dto.brand,
      },
    });

    return partDetails;
  }

  async submitForReview(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        media: true,
        carDetails: true,
        motorcycleDetails: true,
        plateDetails: true,
        partDetails: true,
        paymentTransactions: {
          where: { status: PaymentStatus.PAID },
        },
        owner: {
          select: { email: true, role: true },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.ownerId !== userId) {
      throw new ForbiddenException('You can only submit your own listings');
    }

    if (listing.status !== ListingStatus.DRAFT && listing.status !== ListingStatus.REJECTED) {
      throw new BadRequestException('Listing cannot be submitted in current status');
    }

    // Check merchant subscription (showroom users must have an active subscription)
    if (listing.owner?.role === UserRole.USER_SHOWROOM) {
      const check = await this.packagesService.canMerchantPost(userId);
      if (!check.allowed) {
        throw new ForbiddenException(check.reason);
      }
      // Deduct one listing from merchant's subscription counter
      await this.packagesService.incrementListingsUsed(userId);
    }

    // Check individual listing credits (individual users must have purchased credits)
    if (listing.owner?.role === UserRole.USER_INDIVIDUAL) {
      const check = await this.packagesService.canIndividualPost(userId);
      if (!check.allowed) {
        throw new ForbiddenException(check.reason);
      }
      // Deduct one credit from the individual's oldest active bundle
      await this.packagesService.incrementIndividualCreditsUsed(userId);
    }

    // Validate listing completeness
    const errors: string[] = [];

    if (!listing.title || listing.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters');
    }

    if (!listing.price || Number(listing.price) <= 0) {
      errors.push('Price must be greater than 0');
    }

    if (!listing.locationGovernorate) {
      errors.push('Location governorate is required');
    }

    // Type-specific validation
    if (listing.type === ListingType.CAR) {
      if (!listing.carDetails) {
        errors.push('Car details are required');
      } else {
        if (!listing.carDetails.make) errors.push('Car make is required');
        if (!listing.carDetails.model) errors.push('Car model is required');
        if (!listing.carDetails.year) errors.push('Car year is required');
      }

      // Check minimum images
      const minImages = this.configService.get<number>('media.minImagesForCar') ?? 3;
      const imageCount = listing.media.filter((m) => m.type === 'IMAGE').length;
      if (imageCount < minImages) {
        errors.push(`At least ${minImages} images are required for car listings`);
      }

      // Check payment if required
      const requirePayment = this.configService.get<boolean>('payment.requirePaymentForCarListing');
      if (requirePayment) {
        const hasPaidFee = listing.paymentTransactions.length > 0;
        if (!hasPaidFee) {
          errors.push('Listing fee payment is required');
        }
      }
    } else if (listing.type === ListingType.MOTORCYCLE) {
      if (!listing.motorcycleDetails) {
        errors.push('Motorcycle details are required');
      } else {
        if (!listing.motorcycleDetails.make) errors.push('Motorcycle make is required');
        if (!listing.motorcycleDetails.model) errors.push('Motorcycle model is required');
        if (!listing.motorcycleDetails.year) errors.push('Motorcycle year is required');
      }
    } else if (listing.type === ListingType.PLATE) {
      if (!listing.plateDetails) {
        errors.push('Plate details are required');
      } else {
        if (!listing.plateDetails.plateNumber) errors.push('Plate number is required');
        if (!listing.plateDetails.plateCategory) errors.push('Plate category is required');
      }
    } else if (listing.type === ListingType.PART) {
      if (!listing.partDetails) {
        errors.push('Part details are required');
      } else {
        if (!listing.partDetails.partCategory) errors.push('Part category is required');
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Listing validation failed',
        errors,
      });
    }

    // Submit for review
    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: ListingStatus.PENDING_REVIEW,
      },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        carDetails: true,
        motorcycleDetails: true,
        plateDetails: true,
        partDetails: true,
      },
    });

    // Notify admins
    await this.notificationsService.notifyAdmins(
      NotificationType.SYSTEM,
      'إعلان جديد بانتظار الموافقة',
      `تم تقديم إعلان جديد للمراجعة: ${updated.title}`,
      {
        listingId: updated.id,
        title: updated.title,
        type: updated.type,
        ownerEmail: listing.owner?.email,
        ownerRole: listing.owner?.role,
      },
    );

    return updated;
  }

  async saveAsDraft(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    if (listing.status === ListingStatus.SOLD || listing.status === ListingStatus.ARCHIVED) {
      throw new BadRequestException('Listing cannot be saved as draft in current status');
    }

    if (listing.status === ListingStatus.DRAFT) {
      return listing;
    }

    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: ListingStatus.DRAFT,
        approvedAt: null,
        rejectedAt: null,
        rejectionReason: null,
        postedAt: null,
      },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        carDetails: true,
        plateDetails: true,
        partDetails: true,
      },
    });

    return updated;
  }

  async deleteListing(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    // Soft delete - archive the listing
    await this.prisma.listing.update({
      where: { id: listingId },
      data: { status: ListingStatus.ARCHIVED },
    });

    return { message: 'Listing archived successfully' };
  }

  async markAsSold(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    if (listing.status !== ListingStatus.APPROVED) {
      throw new BadRequestException('Only approved listings can be marked as sold');
    }

    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: { status: ListingStatus.SOLD },
    });

    return updated;
  }

  /**
   * Called when a user responds to a sold-check notification.
   * - isSold = true  → listing marked as SOLD and removed from feed
   * - isSold = false → soldCheckCount reset to 0, listing stays APPROVED
   */
  async respondToSoldCheck(userId: string, listingId: string, isSold: boolean) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.ownerId !== userId) {
      throw new ForbiddenException('You can only respond to your own listings');
    }

    if (listing.status !== ListingStatus.APPROVED) {
      throw new BadRequestException('This listing is no longer active');
    }

    if (isSold) {
      // Mark as sold → removes from public feed
      const updated = await this.prisma.listing.update({
        where: { id: listingId },
        data: {
          status: ListingStatus.SOLD,
          soldCheckCount: 0,
          lastSoldCheckAt: null,
        },
      });

      await this.prisma.notification
        .create({
          data: {
            userId,
            type: NotificationType.SYSTEM,
            title: 'تم تحديث إعلانك',
            body: `تم تسجيل بيع إعلانك "${listing.title}" بنجاح.`,
            metadata: { listingId: listing.id },
            isRead: false,
          },
        })
        .catch(() => {});

      return { status: 'sold', listing: updated };
    } else {
      // Still not sold → reset counter, listing keeps running
      const updated = await this.prisma.listing.update({
        where: { id: listingId },
        data: {
          soldCheckCount: 0,
          lastSoldCheckAt: new Date(),
        },
      });

      return { status: 'still_active', listing: updated };
    }
  }

  async getPublicListings(query: ListingQueryDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // 1. Build Base Filters (Everything EXCEPT Search Text)
    const baseWhere: Prisma.ListingWhereInput = {
      status: ListingStatus.APPROVED,
    };

    if (query.type) {
      baseWhere.type = query.type;
    }

    if (query.governorate) {
      baseWhere.locationGovernorate = query.governorate;
    }

    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      baseWhere.price = {};
      if (query.priceMin !== undefined) {
        baseWhere.price.gte = query.priceMin;
      }
      if (query.priceMax !== undefined) {
        baseWhere.price.lte = query.priceMax;
      }
    }

    // Car-specific filters (Applied to baseWhere)
    if (
      query.type === ListingType.CAR &&
      (query.make || query.model || query.yearMin || query.yearMax || query.color)
    ) {
      baseWhere.carDetails = {};
      if (query.make) {
        baseWhere.carDetails.make = { startsWith: query.make, mode: 'insensitive' };
      }
      if (query.model) {
        baseWhere.carDetails.model = { startsWith: query.model, mode: 'insensitive' };
      }
      if (query.color) {
        baseWhere.carDetails.color = { equals: query.color, mode: 'insensitive' };
      }
      if (query.yearMin !== undefined || query.yearMax !== undefined) {
        baseWhere.carDetails.year = {};
        if (query.yearMin !== undefined) {
          baseWhere.carDetails.year.gte = query.yearMin;
        }
        if (query.yearMax !== undefined) {
          baseWhere.carDetails.year.lte = query.yearMax;
        }
      }
    }

    // Motorcycle-specific filters (Applied to baseWhere)
    if (
      query.type === ListingType.MOTORCYCLE &&
      (query.make || query.model || query.yearMin || query.yearMax || query.color)
    ) {
      baseWhere.motorcycleDetails = {};
      if (query.make) {
        baseWhere.motorcycleDetails.make = { startsWith: query.make, mode: 'insensitive' };
      }
      if (query.model) {
        baseWhere.motorcycleDetails.model = { startsWith: query.model, mode: 'insensitive' };
      }
      if (query.color) {
        baseWhere.motorcycleDetails.color = { equals: query.color, mode: 'insensitive' };
      }
      if (query.yearMin !== undefined || query.yearMax !== undefined) {
        baseWhere.motorcycleDetails.year = {};
        if (query.yearMin !== undefined) {
          baseWhere.motorcycleDetails.year.gte = query.yearMin;
        }
        if (query.yearMax !== undefined) {
          baseWhere.motorcycleDetails.year.lte = query.yearMax;
        }
      }
    }

    // Sorting
    const orderBy: Prisma.ListingOrderByWithRelationInput = {};
    switch (query.sort) {
      case 'price_asc':
        orderBy.price = 'asc';
        break;
      case 'price_desc':
        orderBy.price = 'desc';
        break;
      case 'oldest':
        orderBy.postedAt = 'asc';
        break;
      case 'newest':
      default:
        orderBy.postedAt = 'desc';
        break;
    }

    const include = {
      media: {
        orderBy: { sortOrder: 'asc' },
        take: 5,
      },
      carDetails: true,
      plateDetails: true,
      partDetails: true,
      owner: {
        select: {
          id: true,
          role: true,
          individualProfile: { select: { fullName: true } },
          showroomProfile: { select: { showroomName: true, logoUrl: true } },
        },
      },
    } satisfies Prisma.ListingInclude;

    type ListingWithInclude = Prisma.ListingGetPayload<{ include: typeof include }>;

    let listings: ListingWithInclude[] = [];
    let total = 0;

    // 2. Handle Search Query Logic
    if (query.search) {
      const term = query.search.trim();
      const searchTerms = term.split(/\s+/);
      const isMultiWord = searchTerms.length > 1;

      if (!isMultiWord) {
        // --- SINGLE WORD: SEARCH ONLY BRAND (MAKE) ---
        // Per user request: Restrict single-word search strictly to the Brand (Make).
        // This avoids irrelevant matches like "Ford Taurus" appearing for "T".

        const localWhere: Prisma.ListingWhereInput = {
          ...baseWhere,
          OR: [
            { carDetails: { make: { startsWith: term, mode: 'insensitive' } } },
            { motorcycleDetails: { make: { startsWith: term, mode: 'insensitive' } } },
          ],
        };

        [listings, total] = await Promise.all([
          this.prisma.listing.findMany({
            where: localWhere,
            include,
            orderBy,
            skip,
            take: limit,
          }),
          this.prisma.listing.count({ where: localWhere }),
        ]);
      } else {
        // --- MULTI WORD SEARCH (Existing Logic) ---
        const makePart = searchTerms[0];
        const modelPart = searchTerms.slice(1).join(' ');

        const mwWhere: Prisma.ListingWhereInput = {
          ...baseWhere,
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            {
              AND: [
                { carDetails: { make: { startsWith: makePart, mode: 'insensitive' } } },
                { carDetails: { model: { startsWith: modelPart, mode: 'insensitive' } } },
              ],
            },
            {
              AND: [
                { motorcycleDetails: { make: { startsWith: makePart, mode: 'insensitive' } } },
                { motorcycleDetails: { model: { startsWith: modelPart, mode: 'insensitive' } } },
              ],
            },
          ],
        };

        [listings, total] = await Promise.all([
          this.prisma.listing.findMany({
            where: mwWhere,
            include,
            orderBy,
            skip,
            take: limit,
          }),
          this.prisma.listing.count({ where: mwWhere }),
        ]);
      }
    } else {
      // --- NO SEARCH ---
      [listings, total] = await Promise.all([
        this.prisma.listing.findMany({
          where: baseWhere,
          include,
          orderBy,
          skip,
          take: limit,
        }),
        this.prisma.listing.count({ where: baseWhere }),
      ]);
    }

    return new PaginatedResponse(listings, total, page, limit);
  }

  async getPublicListingById(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        carDetails: true,
        plateDetails: true,
        partDetails: true,
        owner: {
          select: {
            id: true,
            role: true,
            createdAt: true,
            email: true,
            phone: true,
            individualProfile: {
              select: { fullName: true, governorate: true, city: true },
            },
            showroomProfile: {
              select: {
                showroomName: true,
                logoUrl: true,
                governorate: true,
                city: true,
                contactPhones: {
                  select: { phone: true, label: true, isPrimary: true },
                },
              },
            },
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.status !== ListingStatus.APPROVED && listing.status !== ListingStatus.SOLD) {
      throw new NotFoundException('Listing not available');
    }

    // Increment view count
    await this.prisma.listing.update({
      where: { id: listingId },
      data: { viewsCount: { increment: 1 } },
    });

    return listing;
  }

  async getMyListings(userId: string, query: ListingQueryDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      ownerId: userId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.type = query.type;
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: {
          media: {
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
          carDetails: true,
          plateDetails: true,
          partDetails: true,
          paymentTransactions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return new PaginatedResponse(listings, total, page, limit);
  }

  async getMyListingById(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        carDetails: true,
        plateDetails: true,
        partDetails: true,
        paymentTransactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.ownerId !== userId) {
      throw new ForbiddenException('You can only view your own listings');
    }

    return listing;
  }

  private async validateListingOwnership(
    userId: string,
    listingId: string,
    expectedType?: ListingType,
  ) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.ownerId !== userId) {
      throw new ForbiddenException('You can only edit your own listings');
    }

    if (expectedType && listing.type !== expectedType) {
      throw new BadRequestException(`This listing is not a ${expectedType} listing`);
    }

    if (
      listing.status !== ListingStatus.DRAFT &&
      listing.status !== ListingStatus.REJECTED &&
      listing.status !== ListingStatus.APPROVED
    ) {
      throw new BadRequestException('Can only edit draft, rejected, or approved listings');
    }

    return listing;
  }

  // Admin methods
  async getListingByIdAdmin(listingId: string) {
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

    return listing;
  }

  // Favorites methods
  async getFavoriteStatus(listingId: string, userId?: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, favoritesCount: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    let isFavorited = false;
    if (userId) {
      const favorite = await this.prisma.favorite.findUnique({
        where: {
          userId_listingId: {
            userId,
            listingId,
          },
        },
      });
      isFavorited = !!favorite;
    }

    return {
      isFavorited,
      favoritesCount: listing.favoritesCount,
    };
  }

  async addToFavorites(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Check if already favorited
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    });

    if (existing) {
      return { message: 'Already in favorites' };
    }

    // Add to favorites and increment count
    await this.prisma.$transaction([
      this.prisma.favorite.create({
        data: {
          userId,
          listingId,
        },
      }),
      this.prisma.listing.update({
        where: { id: listingId },
        data: {
          favoritesCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return { message: 'Added to favorites' };
  }

  async removeFromFavorites(userId: string, listingId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    });

    if (!favorite) {
      return { message: 'Not in favorites' };
    }

    // Remove from favorites and decrement count
    await this.prisma.$transaction([
      this.prisma.favorite.delete({
        where: {
          userId_listingId: {
            userId,
            listingId,
          },
        },
      }),
      this.prisma.listing.update({
        where: { id: listingId },
        data: {
          favoritesCount: {
            decrement: 1,
          },
        },
      }),
    ]);

    return { message: 'Removed from favorites' };
  }

  async getMyFavorites(userId: string, query: ListingQueryDto) {
    const { page = 1, limit = 20, type } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.FavoriteWhereInput = {
      userId,
      listing: {
        status: ListingStatus.APPROVED,
        ...(type && { type }),
      },
    };

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
            include: {
              media: {
                orderBy: { sortOrder: 'asc' },
                take: 1,
              },
              owner: {
                select: {
                  id: true,
                  email: true,
                  phone: true,
                  individualProfile: {
                    select: {
                      fullName: true,
                    },
                  },
                  showroomProfile: {
                    select: {
                      showroomName: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.favorite.count({ where }),
    ]);

    const listings = favorites.map((f) => f.listing);

    return {
      data: listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
