import { Module } from '@nestjs/common';
import { UsersNicknameResolver } from './users-nickname.resolvers';

@Module({
  providers: [UsersNicknameResolver],
})
export class UsersNicknameModule {}
