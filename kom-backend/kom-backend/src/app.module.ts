import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ListingsModule } from './modules/listings/listings.module';
import { MediaModule } from './modules/media/media.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { ChatsModule } from './modules/chats/chats.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { StoriesModule } from './modules/stories/stories.module';
import { AdminVideosModule } from './modules/admin-videos/admin-videos.module';
import { AdvertisementsModule } from './modules/advertisements/advertisements.module';
import { PackagesModule } from './modules/packages/packages.module';
import { FeaturedModule } from './modules/featured/featured.module';
import { EmailModule } from './modules/email/email.module';
import { LuckModule } from './modules/luck/luck.module';
import { PublicHealthModule } from './health/health.module';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Database
    PrismaModule,

    // Scheduling
    ScheduleModule.forRoot(),

    // Feature modules
    PublicHealthModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    MediaModule,
    ModerationModule,
    PaymentsModule,
    NotificationsModule,
    ReportsModule,
    ChatsModule,
    AdminModule,
    HealthModule,
    TasksModule,
    StoriesModule,
    AdminVideosModule,
    AdvertisementsModule,
    PackagesModule,
    FeaturedModule,
    EmailModule,
    LuckModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
