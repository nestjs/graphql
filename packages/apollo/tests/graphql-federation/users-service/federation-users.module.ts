import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled';
import { join } from 'path';
import { ApolloDriverConfig } from '../../../lib/index.js';
import { ApolloFederationDriver } from '../../../lib/drivers/index.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloFederationDriver,
      typePaths: [join(import.meta.dirname, '**/*.graphql')],
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    }),
    UsersModule,
  ],
})
export class AppModule {}
