import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig } from '../../lib/index.js';
import { ApolloFederationDriver } from '../../lib/drivers/index.js';
import { PostModule } from './post/post.module.js';
import { User } from './user/user.entity.js';
import { UserModule } from './user/user.module.js';

@Module({
  imports: [
    UserModule,
    PostModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloFederationDriver,
      includeStacktraceInErrorResponses: false,
      autoSchemaFile: {
        path: 'federation2-schema.graphql',
        federation: 2,
      },
      buildSchemaOptions: {
        orphanedTypes: [User],
      },
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    }),
  ],
})
export class Federation2AutoSchemaFileModule {}
