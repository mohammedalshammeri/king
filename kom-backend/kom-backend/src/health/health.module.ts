import { Module } from '@nestjs/common';
import { PublicHealthController } from './health.controller';

@Module({
  controllers: [PublicHealthController],
})
export class PublicHealthModule {}
