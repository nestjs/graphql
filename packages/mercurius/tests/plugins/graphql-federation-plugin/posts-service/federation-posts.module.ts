import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import {
  MercuriusFederationDriver,
  MercuriusFederationDriverConfig,
} from '../../../../lib/index.js';
import { PostsModule } from '../../../graphql-federation/posts-service/posts/posts.module.js';
import { upperDirectiveTransformer } from '../../../graphql-federation/posts-service/posts/upper.directive.js';
import { mockPlugin } from '../../mocks/mock.plugin.js';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusFederationDriverConfig>({
      driver: MercuriusFederationDriver,
      typePaths: [
        join(
          import.meta.dirname,
          '../../../graphql-federation/posts-service',
          '**/*.graphql',
        ),
      ],
      transformSchema: (schema) => upperDirectiveTransformer(schema, 'upper'),
      plugins: [
        {
          plugin: mockPlugin as any,
        },
      ],
    }),
    PostsModule,
  ],
})
export class AppModule {}
