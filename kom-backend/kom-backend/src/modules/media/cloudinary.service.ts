import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('cloudinary.cloudName');
    const apiKey = this.configService.get<string>('cloudinary.apiKey');
    const apiSecret = this.configService.get<string>('cloudinary.apiSecret');

    if (!cloudName || !apiKey || !apiSecret) {
      this.isConfigured = false;
      return;
    }

    this.isConfigured = true;

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  uploadBuffer(
    buffer: Buffer,
    options: {
      folder: string;
      resourceType: 'image' | 'video' | 'raw' | 'auto';
    },
  ): Promise<{
    secureUrl: string;
    publicId: string;
    bytes?: number;
    width?: number;
    height?: number;
    duration?: number;
  }> {
    if (!this.isConfigured) {
      throw new BadRequestException(
        'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET',
      );
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder,
          resource_type: options.resourceType,
        },
        (error, result) => {
          if (error || !result) {
            const message = (() => {
              if (typeof error === 'object' && error !== null) {
                const errObj = error as Record<string, unknown>;
                const directMessage = errObj['message'];
                if (typeof directMessage === 'string') return directMessage;

                const nested = errObj['error'];
                if (typeof nested === 'object' && nested !== null) {
                  const nestedMessage = (nested as Record<string, unknown>)['message'];
                  if (typeof nestedMessage === 'string') return nestedMessage;
                }
              }

              return 'Cloudinary upload failed';
            })();

            // Common misconfiguration: cloud name doesn't match the API key/secret account.
            if (
              typeof message === 'string' &&
              message.toLowerCase().includes('invalid cloud_name')
            ) {
              reject(
                new BadRequestException(
                  'Cloudinary configuration error: Invalid cloud name. Set CLOUDINARY_CLOUD_NAME to your Cloudinary account cloud name (the one shown in Cloudinary dashboard), then restart the backend.',
                ),
              );
              return;
            }

            reject(new BadRequestException(message));
            return;
          }

          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            duration: (() => {
              const duration = (result as unknown as { duration?: unknown }).duration;
              return typeof duration === 'number' ? duration : undefined;
            })(),
          });
        },
      );

      stream.end(buffer);
    });
  }
}
