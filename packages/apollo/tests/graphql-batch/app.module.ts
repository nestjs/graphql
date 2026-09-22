import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ApolloDriver } from '../../lib/drivers/index.js';
import { ApolloDriverConfig } from '../../lib/index.js';
import { BlogService } from '../code-first-batch/blog.service.js';
import { PostsResolver } from './posts.resolver.js';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: [join(import.meta.dirname, '*.graphql')],
    }),
  ],
  providers: [BlogService, PostsResolver],
})
export class ApplicationModule {}
