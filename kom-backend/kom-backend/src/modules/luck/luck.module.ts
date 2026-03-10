import { Module } from '@nestjs/common';
import { LuckService } from './luck.service';
import { LuckController } from './luck.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [LuckController],
  providers: [LuckService],
  exports: [LuckService],
})
export class LuckModule {}
