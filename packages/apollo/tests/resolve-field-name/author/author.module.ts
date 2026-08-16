import { Module } from '@nestjs/common';
import { AuthorResolver } from './author.resolver.js';

@Module({
  providers: [AuthorResolver],
})
export class AuthorModule {}
