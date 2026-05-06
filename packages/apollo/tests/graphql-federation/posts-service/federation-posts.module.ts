import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled';
import { join } from 'path';
import { ApolloDriverConfig } from '../../../lib/index.js';
import { ApolloFederationDriver } from '../../../lib/drivers/index.js';
import { PostsModule } from './posts/posts.module.js';
import { upperDirectiveTransformer } from './posts/upper.directive.js';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloFederationDriver,
      typePaths: [join(import.meta.dirname, '**/*.graphql')],
      transformSchema: (schema) => upperDirectiveTransformer(schema, 'upper'),
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    }),
    PostsModule,
  ],
})
export class AppModule {}
