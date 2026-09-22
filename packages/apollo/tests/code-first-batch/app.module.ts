import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '../../lib/drivers/index.js';
import { ApolloDriverConfig } from '../../lib/index.js';
import { BlogService } from './blog.service.js';
import { PostsResolver } from './posts.resolver.js';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      includeStacktraceInErrorResponses: false,
    }),
  ],
  providers: [BlogService, PostsResolver],
})
export class ApplicationModule {}
