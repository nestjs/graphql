import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver.js';
import { UserService } from './user.service.js';

@Module({
  providers: [UserResolver, UserService],
})
export class UserModule {}
