import responseCachePlugin from '@apollo/server-plugin-response-cache';
import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import {
  DirectiveLocation,
  GraphQLBoolean,
  GraphQLDirective,
  GraphQLEnumType,
  GraphQLInt,
} from 'graphql';
import { ApolloFederationDriverConfig } from '../../lib/index.js';
import { ApolloFederationDriver } from '../../lib/drivers/index.js';
import { PostModule } from './post/post.module.js';
import { RecipeModule } from './recipe/recipe.module.js';
import { User } from './user/user.entity.js';
import { UserModule } from './user/user.module.js';

@Module({
  imports: [
    UserModule,
    PostModule,
    RecipeModule,
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      includeStacktraceInErrorResponses: false,
      autoSchemaFile: true,
      buildSchemaOptions: {
        orphanedTypes: [User],
        directives: [
          new GraphQLDirective({
            name: 'cacheControl',
            locations: [
              DirectiveLocation.FIELD_DEFINITION,
              DirectiveLocation.OBJECT,
              DirectiveLocation.INTERFACE,
              DirectiveLocation.UNION,
            ],
            args: {
              maxAge: { type: GraphQLInt },
              scope: {
                type: new GraphQLEnumType({
                  name: 'CacheControlScope',
                  values: {
                    PUBLIC: {},
                    PRIVATE: {},
                  },
                }),
              },
              inheritMaxAge: { type: GraphQLBoolean },
            },
          }),
        ],
      },
      plugins: [responseCachePlugin(), ApolloServerPluginInlineTraceDisabled()],
    }),
  ],
})
export class CachingApplicationModule {}
