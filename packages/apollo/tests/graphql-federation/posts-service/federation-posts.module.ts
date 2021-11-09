import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql-experimental';
import { ApolloServerPluginInlineTraceDisabled } from 'apollo-server-core';
import { join } from 'path';
import { ApolloAdapterOptions } from '../../../lib';
import { ApolloFederationGraphQLAdapter } from '../../../lib/adapters';
import { PostsModule } from './posts/posts.module';
import { UpperCaseDirective } from './posts/upper.directive';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloAdapterOptions>({
      adapter: ApolloFederationGraphQLAdapter,
      typePaths: [join(__dirname, '**/*.graphql')],
      schemaDirectives: {
        upper: UpperCaseDirective,
      },
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    }),
    PostsModule,
  ],
})
export class AppModule {}
