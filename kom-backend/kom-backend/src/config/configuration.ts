const getRequiredEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be set`);
  }
  return value;
};

const getCorsOrigins = (): string[] => {
  const configuredOrigins = process.env.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins && configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  return [
    'https://kotm.app',
    'https://www.kotm.app',
    'https://admin.kotm.app',
    'https://api.kotm.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:8081',
  ];
};

export default () => ({
  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // JWT
  jwt: {
    accessSecret: getRequiredEnv('JWT_ACCESS_SECRET'),
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshSecret: getRequiredEnv('JWT_REFRESH_SECRET'),
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  auth: {
    googleClientIds: (process.env.GOOGLE_CLIENT_IDS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    appleAudience: process.env.APPLE_AUTH_AUDIENCE || process.env.APPLE_BUNDLE_ID || 'app.kotm.kom',
  },

  cors: {
    origins: getCorsOrigins(),
  },

  // S3/R2 Storage
  storage: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'me-south-1',
    bucket: process.env.S3_BUCKET || 'kom-media',
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    cdnBaseUrl: process.env.PUBLIC_CDN_BASE_URL,
    presignUploadExpiration: parseInt(process.env.PRESIGN_UPLOAD_EXPIRATION || '3600', 10),
    presignDownloadExpiration: parseInt(process.env.PRESIGN_DOWNLOAD_EXPIRATION || '86400', 10),
  },

  // Cloudinary Storage
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // Payment
  payment: {
    requirePaymentForCarListing: process.env.REQUIRE_PAYMENT_FOR_CAR_LISTING === 'true',
    listingFeeBhd: parseFloat(process.env.LISTING_FEE_BHD || '3'),
  },

  // Media limits
  media: {
    maxImagesPerListing: parseInt(process.env.MAX_IMAGES_PER_LISTING || '15', 10),
    maxVideosPerListing: parseInt(process.env.MAX_VIDEOS_PER_LISTING || '2', 10),
    maxImageSizeMb: parseInt(process.env.MAX_IMAGE_SIZE_MB || '10', 10),
    maxVideoSizeMb: parseInt(process.env.MAX_VIDEO_SIZE_MB || '100', 10),
    minImagesForCar: parseInt(process.env.MIN_IMAGES_FOR_CAR || '3', 10),
  },

  // Rate limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
    loginLimit: parseInt(process.env.THROTTLE_LOGIN_LIMIT || '5', 10),
    uploadLimit: parseInt(process.env.THROTTLE_UPLOAD_LIMIT || '30', 10),
  },

  // Push notifications (FCM)
  fcm: {
    projectId: process.env.FCM_PROJECT_ID,
    privateKey: process.env.FCM_PRIVATE_KEY,
    clientEmail: process.env.FCM_CLIENT_EMAIL,
  },

  // Redis (optional)
  redis: {
    url: process.env.REDIS_URL,
  },

  // Email (Resend)
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM || 'KOM – ملك السوق <info@kotm.app>',
    appUrl: process.env.APP_URL || 'https://kotm.app',
  },
});
