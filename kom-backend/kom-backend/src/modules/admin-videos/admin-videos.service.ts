import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../media/cloudinary.service';
import { CreateAdminVideoDto } from './dto/create-admin-video.dto';

@Injectable()
export class AdminVideosService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async create(file: Express.Multer.File, dto: CreateAdminVideoDto) {
    const result = await this.cloudinary.uploadBuffer(file.buffer, {
      folder: 'admin-videos',
      resourceType: 'video',
    });

    // Simple thumbnail generation heuristic for Cloudinary videos
    // Replacing file extension with .jpg usually gets the poster image
    const thumbnailUrl = result.secureUrl.replace(/\.[^/.]+$/, '.jpg');

    return this.prisma.adminVideo.create({
      data: {
        title: dto.title,
        description: dto.description,
        videoUrl: result.secureUrl,
        thumbnailUrl: thumbnailUrl,
        isActive: true,
      },
    });
  }

  async findAll() {
    return this.prisma.adminVideo.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string) {
    return this.prisma.adminVideo.delete({
      where: { id },
    });
  }
}
