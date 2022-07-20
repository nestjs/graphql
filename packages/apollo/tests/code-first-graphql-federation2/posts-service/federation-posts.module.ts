import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloServerPluginInlineTraceDisabled } from 'apollo-server-core';
import { ApolloDriverConfig } from '../../../lib';
import { ApolloFederationDriver } from '../../../lib/drivers';
import { PostsModule } from './posts/posts.module';
import { User } from './posts/user.entity';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
      buildSchemaOptions: {
        orphanedTypes: [User],
      },
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    }),
    PostsModule,
  ],
})
export class AppModule {}
