import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PresignRequestDto, FinalizeMediaDto, ReorderMediaDto, UploadMediaDto } from './dto';

type UploadedMediaFile = {
  buffer: Buffer;
  mimetype?: string;
  size?: number;
  originalname?: string;
};

@ApiTags('Media')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        // Backstop; detailed size validation is handled in MediaService via config.
        fileSize: 120 * 1024 * 1024,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload media directly (Cloudinary) and attach to listing' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        listingId: { type: 'string', format: 'uuid' },
        type: { type: 'string', enum: ['IMAGE', 'VIDEO'] },
        file: { type: 'string', format: 'binary' },
      },
      required: ['listingId', 'type', 'file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Media uploaded and record created' })
  async uploadMedia(
    @CurrentUser('id') userId: string,
    @Body() dto: UploadMediaDto,
    @UploadedFile() file: UploadedMediaFile,
  ) {
    return this.mediaService.uploadMedia(userId, dto, file);
  }

  @Post('presign')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Generate presigned URL for media upload' })
  @ApiResponse({ status: 200, description: 'Presigned URL generated' })
  @ApiResponse({ status: 400, description: 'Invalid request or limits exceeded' })
  async generatePresignedUrl(@CurrentUser('id') userId: string, @Body() dto: PresignRequestDto) {
    return this.mediaService.generatePresignedUrl(userId, dto);
  }

  @Post('finalize')
  @ApiOperation({ summary: 'Finalize media upload after S3 upload completes' })
  @ApiResponse({ status: 201, description: 'Media record created' })
  async finalizeMedia(@CurrentUser('id') userId: string, @Body() dto: FinalizeMediaDto) {
    return this.mediaService.finalizeMedia(userId, dto);
  }

  @Delete(':mediaId')
  @ApiOperation({ summary: 'Delete media from listing' })
  @ApiResponse({ status: 200, description: 'Media deleted' })
  async deleteMedia(@CurrentUser('id') userId: string, @Param('mediaId') mediaId: string) {
    return this.mediaService.deleteMedia(userId, mediaId);
  }

  @Patch('reorder/:listingId')
  @ApiOperation({ summary: 'Reorder media for a listing' })
  @ApiResponse({ status: 200, description: 'Media reordered' })
  async reorderMedia(
    @CurrentUser('id') userId: string,
    @Param('listingId') listingId: string,
    @Body() dto: ReorderMediaDto,
  ) {
    return this.mediaService.reorderMedia(userId, listingId, dto.mediaIds);
  }
}
