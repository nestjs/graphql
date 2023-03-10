import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import {
  MercuriusFederationDriver,
  MercuriusFederationDriverConfig,
} from '../../../lib';
import { PostsModule } from './posts/posts.module';
import { upperDirectiveTransformer } from './posts/upper.directive';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusFederationDriverConfig>({
      driver: MercuriusFederationDriver,
      typePaths: [join(__dirname, '**/*.graphql')],
      transformSchema: (schema) => upperDirectiveTransformer(schema, 'upper'),
    }),
    PostsModule,
  ],
})
export class AppModule {}
