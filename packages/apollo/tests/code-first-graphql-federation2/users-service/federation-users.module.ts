import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloServerPluginInlineTraceDisabled } from 'apollo-server-core';
import { ApolloDriverConfig } from '../../../lib';
import { ApolloFederationDriver } from '../../../lib/drivers';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    }),
    UsersModule,
  ],
})
export class AppModule {}
