import { Module } from '@nestjs/common';
import { UsersResolver } from './users.resolver.js';

@Module({
  providers: [UsersResolver],
})
export class UsersModule {}
