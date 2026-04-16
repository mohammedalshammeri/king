import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export interface PresignedUrlResponse {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  expiresIn: number;
}

export interface UploadedObjectResponse {
  objectKey: string;
  publicUrl: string;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly cdnBaseUrl: string | null;
  private readonly region: string;
  private readonly endpoint: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('storage.bucket') || 'kom-media';
    this.cdnBaseUrl = this.configService.get<string>('storage.cdnBaseUrl') || null;
    this.region = this.configService.get<string>('storage.region') || 'me-south-1';
    this.endpoint = this.configService.get<string>('storage.endpoint');

    const accessKey = this.configService.get<string>('storage.accessKey');
    const secretKey = this.configService.get<string>('storage.secretKey');

    this.s3Client = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      credentials:
        accessKey && secretKey
          ? {
              accessKeyId: accessKey,
              secretAccessKey: secretKey,
            }
          : undefined,
      forcePathStyle: !!this.endpoint, // Required for R2 and similar services
    });
  }

  async generatePresignedUploadUrl(
    folder: string,
    fileName: string,
    contentType: string,
    fileSize: number,
  ): Promise<PresignedUrlResponse> {
    const objectKey = this.buildObjectKey(folder, fileName, contentType);

    const expiresIn = this.configService.get<number>('storage.presignUploadExpiration') || 3600;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ContentType: contentType,
      ContentLength: fileSize,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

    const publicUrl = this.getPublicUrl(objectKey);

    return {
      uploadUrl,
      objectKey,
      publicUrl,
      expiresIn,
    };
  }

  async uploadBuffer(
    folder: string,
    buffer: Buffer,
    contentType: string,
    fileName?: string,
  ): Promise<UploadedObjectResponse> {
    const objectKey = this.buildObjectKey(folder, fileName, contentType);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);

    return {
      objectKey,
      publicUrl: this.getPublicUrl(objectKey),
    };
  }

  async generatePresignedDownloadUrl(objectKey: string): Promise<string> {
    const expiresIn = this.configService.get<number>('storage.presignDownloadExpiration') || 86400;

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteObject(objectKey: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      });

      await this.s3Client.send(command);
      this.logger.log(`Deleted object: ${objectKey}`);
    } catch (error) {
      this.logger.error(`Failed to delete object ${objectKey}:`, error);
      throw error;
    }
  }

  getPublicUrl(objectKey: string): string {
    if (this.cdnBaseUrl) {
      return `${this.cdnBaseUrl}/${objectKey}`;
    }

    if (this.endpoint) {
      return `${this.endpoint}/${this.bucket}/${objectKey}`;
    }

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${objectKey}`;
  }

  validateContentType(contentType: string, mediaType: 'IMAGE' | 'VIDEO'): boolean {
    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
    ];

    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm'];

    if (mediaType === 'IMAGE') {
      return allowedImageTypes.includes(contentType.toLowerCase());
    }

    return allowedVideoTypes.includes(contentType.toLowerCase());
  }

  getMaxFileSize(mediaType: 'IMAGE' | 'VIDEO'): number {
    if (mediaType === 'IMAGE') {
      const maxMb = this.configService.get<number>('media.maxImageSizeMb') || 10;
      return maxMb * 1024 * 1024;
    }

    const maxMb = this.configService.get<number>('media.maxVideoSizeMb') || 100;
    return maxMb * 1024 * 1024;
  }

  private buildObjectKey(folder: string, fileName: string | undefined, contentType: string): string {
    const normalizedFolder = folder.replace(/\/+$/, '');
    const explicitExtension = fileName?.split('.').pop()?.trim();
    const mimeExtension = this.getExtensionFromContentType(contentType);
    const extension = explicitExtension || mimeExtension;
    const suffix = extension ? `.${extension}` : '';
    return `${normalizedFolder}/${uuidv4()}${suffix}`;
  }

  private getExtensionFromContentType(contentType: string): string | undefined {
    const normalizedType = contentType.toLowerCase();
    const extensionMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'video/x-m4v': 'm4v',
      'video/webm': 'webm',
    };

    return extensionMap[normalizedType];
  }
}
