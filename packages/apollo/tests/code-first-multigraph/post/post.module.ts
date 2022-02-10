import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

import { ApolloDriverConfig } from '../../../lib';
import { ApolloFederationDriver } from '../../../lib/drivers';

import { UserResolver } from './external-user/user.resolver';
import { PostResolver } from './post.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloFederationDriver,
      debug: false,
      autoSchemaFile: true,
      path: '/post/graphql',
      include: [PostModule],
    }),
  ],
  providers: [PostResolver, UserResolver],
})
export class PostModule {}
