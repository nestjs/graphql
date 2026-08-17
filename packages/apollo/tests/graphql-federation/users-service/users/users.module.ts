import { Module } from '@nestjs/common';
import { UsersResolvers } from './users.resolvers.js';
import { UsersService } from './users.service.js';

@Module({
  providers: [UsersResolvers, UsersService],
})
export class UsersModule {}
