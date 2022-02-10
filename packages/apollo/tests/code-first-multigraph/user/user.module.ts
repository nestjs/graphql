import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

import { ApolloDriverConfig } from '../../../lib';
import { ApolloFederationDriver } from '../../../lib/drivers';

import { UserResolver } from './user.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloFederationDriver,
      debug: false,
      autoSchemaFile: true,
      path: '/user/graphql',
      include: [UserModule],
    }),
  ],
  providers: [UserResolver],
})
export class UserModule {}
