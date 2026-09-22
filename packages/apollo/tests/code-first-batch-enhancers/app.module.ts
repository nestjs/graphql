import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '../../lib/drivers/index.js';
import { ApolloDriverConfig } from '../../lib/index.js';
import { BlogService } from '../code-first-batch/blog.service.js';
import { PostsResolver } from './posts.resolver.js';
import { GuardCallsService, RecordingGuard } from './recording.guard.js';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      includeStacktraceInErrorResponses: false,
      fieldResolverEnhancers: ['guards'],
    }),
  ],
  providers: [BlogService, PostsResolver, GuardCallsService, RecordingGuard],
})
export class ApplicationModule {}
