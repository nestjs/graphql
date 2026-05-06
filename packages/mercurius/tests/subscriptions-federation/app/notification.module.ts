import { Module } from '@nestjs/common';
import { NotificationResolver } from './notification.resolver.js';

@Module({
  providers: [NotificationResolver],
})
export class NotificationModule {}
