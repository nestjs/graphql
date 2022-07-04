import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { PostModule } from '../posts/post.module';

@Module({
  providers: [UserResolver],
  imports: [PostModule],
})
export class UserModule {}
