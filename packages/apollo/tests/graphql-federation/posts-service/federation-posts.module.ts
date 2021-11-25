import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloServerPluginInlineTraceDisabled } from 'apollo-server-core';
import { join } from 'path';
import { ApolloDriverConfig } from '../../../lib';
import { ApolloFederationDriver } from '../../../lib/drivers';
import { PostsModule } from './posts/posts.module';
import { upperDirectiveTransformer } from './posts/upper.directive';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloFederationDriver,
      typePaths: [join(__dirname, '**/*.graphql')],
      transformSchema: (schema) => upperDirectiveTransformer(schema, 'upper'),
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    }),
    PostsModule,
  ],
})
export class AppModule {}
