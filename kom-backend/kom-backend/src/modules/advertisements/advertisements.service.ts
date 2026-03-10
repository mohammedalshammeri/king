import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../media/cloudinary.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';

@Injectable()
export class AdvertisementsService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async create(file: Express.Multer.File, dto: CreateAdvertisementDto) {
    const isVideo = file.mimetype.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

    const result = await this.cloudinary.uploadBuffer(file.buffer, {
      folder: 'advertisements',
      resourceType,
    });

    let thumbnailUrl: string | undefined;
    if (isVideo) {
      thumbnailUrl = result.secureUrl.replace(/\.[^/.]+$/, '.jpg');
    } else {
      thumbnailUrl = result.secureUrl;
    }

    return this.prisma.advertisement.create({
      data: {
        title: dto.title,
        mediaUrl: result.secureUrl,
        mediaType: isVideo ? 'VIDEO' : 'IMAGE',
        thumbnailUrl,
        linkUrl: dto.linkUrl,
        isActive: true,
        sortOrder: dto.sortOrder ? parseInt(dto.sortOrder, 10) : 0,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async findAll() {
    const now = new Date();
    return this.prisma.advertisement.findMany({
      where: {
        isActive: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [
          {
            OR: [{ endDate: null }, { endDate: { gte: now } }],
          },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async incrementView(id: string) {
    return this.prisma.advertisement.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });
  }

  async incrementClick(id: string) {
    return this.prisma.advertisement.update({
      where: { id },
      data: { clicksCount: { increment: 1 } },
    });
  }

  async findAllAdmin() {
    return this.prisma.advertisement.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async updateActive(id: string, isActive: boolean) {
    return this.prisma.advertisement.update({
      where: { id },
      data: { isActive },
    });
  }

  async remove(id: string) {
    return this.prisma.advertisement.delete({ where: { id } });
  }
}
