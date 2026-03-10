import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from './s3.service';
import { CloudinaryService } from './cloudinary.service';
import { MediaType, ListingStatus, StorageProvider } from '@prisma/client';
import { PresignRequestDto, FinalizeMediaDto, UploadMediaDto } from './dto';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService,
  ) {}

  async uploadMedia(
    userId: string,
    dto: UploadMediaDto,
    file: { buffer: Buffer; mimetype?: string; size?: number },
  ) {
    // Validate listing ownership and status
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      include: { media: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.ownerId !== userId) {
      throw new ForbiddenException('You can only upload media to your own listings');
    }

    if (
      listing.status !== ListingStatus.DRAFT &&
      listing.status !== ListingStatus.REJECTED &&
      listing.status !== ListingStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Can only upload media to draft, rejected, or approved listings',
      );
    }

    if (!file || !file.buffer) {
      throw new BadRequestException('File is required');
    }

    const contentType = file.mimetype || '';
    const fileSize = file.size || 0;

    if (!this.s3Service.validateContentType(contentType, dto.type)) {
      throw new BadRequestException(`Invalid content type for ${dto.type}`);
    }

    const maxSize = this.s3Service.getMaxFileSize(dto.type);
    if (fileSize > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed (${Math.round(maxSize / 1024 / 1024)}MB)`,
      );
    }

    // Check media limits
    const currentImageCount = listing.media.filter((m) => m.type === MediaType.IMAGE).length;
    const currentVideoCount = listing.media.filter((m) => m.type === MediaType.VIDEO).length;

    const maxImages = this.configService.get<number>('media.maxImagesPerListing') || 15;
    const maxVideos = this.configService.get<number>('media.maxVideosPerListing') || 2;

    if (dto.type === MediaType.IMAGE && currentImageCount >= maxImages) {
      throw new BadRequestException(`Maximum ${maxImages} images allowed per listing`);
    }

    if (dto.type === MediaType.VIDEO && currentVideoCount >= maxVideos) {
      throw new BadRequestException(`Maximum ${maxVideos} videos allowed per listing`);
    }

    // Determine sort order
    const sameTypeMedia = listing.media.filter((m) => m.type === dto.type);
    const maxSortOrder =
      sameTypeMedia.length > 0 ? Math.max(...sameTypeMedia.map((m) => m.sortOrder)) : -1;
    const sortOrder = maxSortOrder + 1;

    // Upload to Cloudinary
    const folder = `listings/${dto.listingId}/${dto.type.toLowerCase()}s`;
    const resourceType = dto.type === MediaType.VIDEO ? 'video' : 'image';
    let uploaded: {
      secureUrl: string;
      publicId: string;
      bytes?: number;
      width?: number;
      height?: number;
      duration?: number;
    };

    try {
      uploaded = await this.cloudinaryService.uploadBuffer(file.buffer, {
        folder,
        resourceType,
      });
    } catch (err: unknown) {
      // Convert unexpected Cloudinary errors into a clear 400 for the client.
      if (err instanceof BadRequestException) {
        throw err;
      }

      const message =
        typeof err === 'object' &&
        err !== null &&
        'message' in err &&
        typeof (err as { message?: unknown }).message === 'string'
          ? (err as { message: string }).message
          : 'Media upload failed';
      throw new BadRequestException(message);
    }

    const media = await this.prisma.media.create({
      data: {
        listingId: dto.listingId,
        type: dto.type,
        // Note: Cloudinary isn't modeled in StorageProvider enum yet; we store URLs directly.
        storageProvider: StorageProvider.S3,
        objectKey: uploaded.publicId,
        url: uploaded.secureUrl,
        thumbnailUrl: null,
        width: uploaded.width,
        height: uploaded.height,
        duration: uploaded.duration ? Math.round(uploaded.duration) : undefined,
        fileSize: uploaded.bytes ?? fileSize,
        mimeType: contentType,
        sortOrder,
      },
    });

    return media;
  }

  async generatePresignedUrl(userId: string, dto: PresignRequestDto) {
    // Validate listing ownership and status
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      include: { media: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.ownerId !== userId) {
      throw new ForbiddenException('You can only upload media to your own listings');
    }

    if (
      listing.status !== ListingStatus.DRAFT &&
      listing.status !== ListingStatus.REJECTED &&
      listing.status !== ListingStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Can only upload media to draft, rejected, or approved listings',
      );
    }

    // Validate content type
    if (!this.s3Service.validateContentType(dto.contentType, dto.type)) {
      throw new BadRequestException(`Invalid content type for ${dto.type}`);
    }

    // Validate file size
    const maxSize = this.s3Service.getMaxFileSize(dto.type);
    if (dto.fileSize > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed (${Math.round(maxSize / 1024 / 1024)}MB)`,
      );
    }

    // Check media limits
    const currentImageCount = listing.media.filter((m) => m.type === MediaType.IMAGE).length;
    const currentVideoCount = listing.media.filter((m) => m.type === MediaType.VIDEO).length;

    const maxImages = this.configService.get<number>('media.maxImagesPerListing') || 15;
    const maxVideos = this.configService.get<number>('media.maxVideosPerListing') || 2;

    if (dto.type === MediaType.IMAGE && currentImageCount >= maxImages) {
      throw new BadRequestException(`Maximum ${maxImages} images allowed per listing`);
    }

    if (dto.type === MediaType.VIDEO && currentVideoCount >= maxVideos) {
      throw new BadRequestException(`Maximum ${maxVideos} videos allowed per listing`);
    }

    // Generate presigned URL
    const folder = `listings/${dto.listingId}/${dto.type.toLowerCase()}s`;
    const presigned = await this.s3Service.generatePresignedUploadUrl(
      folder,
      dto.fileName,
      dto.contentType,
      dto.fileSize,
    );

    return {
      uploadUrl: presigned.uploadUrl,
      objectKey: presigned.objectKey,
      publicUrl: presigned.publicUrl,
      expiresIn: presigned.expiresIn,
      requiredHeaders: {
        'Content-Type': dto.contentType,
        'Content-Length': dto.fileSize.toString(),
      },
    };
  }

  async finalizeMedia(userId: string, dto: FinalizeMediaDto) {
    // Validate listing ownership
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      include: { media: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.ownerId !== userId) {
      throw new ForbiddenException('You can only add media to your own listings');
    }

    // Determine sort order
    const sameTypeMedia = listing.media.filter((m) => m.type === dto.type);
    const maxSortOrder =
      sameTypeMedia.length > 0 ? Math.max(...sameTypeMedia.map((m) => m.sortOrder)) : -1;

    const sortOrder = dto.sortOrder !== undefined ? dto.sortOrder : maxSortOrder + 1;

    // Create media record
    const media = await this.prisma.media.create({
      data: {
        listingId: dto.listingId,
        type: dto.type,
        storageProvider: StorageProvider.S3,
        objectKey: dto.objectKey,
        url: dto.url,
        thumbnailUrl: dto.thumbnailUrl,
        width: dto.width,
        height: dto.height,
        duration: dto.duration,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        sortOrder,
      },
    });

    return media;
  }

  async deleteMedia(userId: string, mediaId: string) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      include: { listing: true },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    if (media.listing.ownerId !== userId) {
      throw new ForbiddenException('You can only delete media from your own listings');
    }

    if (
      media.listing.status !== ListingStatus.DRAFT &&
      media.listing.status !== ListingStatus.REJECTED &&
      media.listing.status !== ListingStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Can only delete media from draft, rejected, or approved listings',
      );
    }

    // Delete from S3
    try {
      await this.s3Service.deleteObject(media.objectKey);
    } catch (error) {
      // Log error but continue with database deletion
      console.error('Failed to delete from S3:', error);
    }

    // Delete from database
    await this.prisma.media.delete({
      where: { id: mediaId },
    });

    return { message: 'Media deleted successfully' };
  }

  async reorderMedia(userId: string, listingId: string, mediaIds: string[]) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { media: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.ownerId !== userId) {
      throw new ForbiddenException('You can only reorder media for your own listings');
    }

    // Update sort orders
    const updates = mediaIds.map((id, index) =>
      this.prisma.media.update({
        where: { id },
        data: { sortOrder: index },
      }),
    );

    await this.prisma.$transaction(updates);

    // Return updated media
    const updatedMedia = await this.prisma.media.findMany({
      where: { listingId },
      orderBy: { sortOrder: 'asc' },
    });

    return updatedMedia;
  }

  async getListingMedia(listingId: string) {
    const media = await this.prisma.media.findMany({
      where: { listingId },
      orderBy: { sortOrder: 'asc' },
    });

    return media;
  }
}
