import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '../../lib/drivers/index.js';
import { ApolloDriverConfig } from '../../lib/index.js';
import {
  CommentMapper,
  CommentsConnectionInterceptor,
  InterceptorCallsService,
} from './comments-connection.interceptor.js';
import { CommentsRepository, PostsResolver } from './posts.resolver.js';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      includeStacktraceInErrorResponses: false,
      fieldResolverEnhancers: ['interceptors'],
    }),
  ],
  providers: [
    PostsResolver,
    CommentsRepository,
    CommentMapper,
    InterceptorCallsService,
    CommentsConnectionInterceptor,
  ],
})
export class ApplicationModule {}
