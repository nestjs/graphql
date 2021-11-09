import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql-experimental';
import { ApolloServerPluginInlineTraceDisabled } from 'apollo-server-core';
import { join } from 'path';
import { ApolloAdapterOptions } from '../../../lib';
import { ApolloFederationGraphQLAdapter } from '../../../lib/adapters';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloAdapterOptions>({
      adapter: ApolloFederationGraphQLAdapter,
      typePaths: [join(__dirname, '**/*.graphql')],
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    }),
    UsersModule,
  ],
})
export class AppModule {}
