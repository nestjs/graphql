import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import {
  MercuriusFederationDriver,
  MercuriusFederationDriverConfig,
} from '../../../../lib';
import { PostsModule } from '../../../graphql-federation/posts-service/posts/posts.module';
import { upperDirectiveTransformer } from '../../../graphql-federation/posts-service/posts/upper.directive';
import { mockPlugin } from '../../mocks/mock.plugin';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusFederationDriverConfig>({
      driver: MercuriusFederationDriver,
      typePaths: [
        join(
          __dirname,
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
