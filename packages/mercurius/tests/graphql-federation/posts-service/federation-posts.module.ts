import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { MercuriusDriverConfig, MercuriusFederationDriver } from '../../../lib';
import { PostsModule } from './posts/posts.module';
import { upperDirectiveTransformer } from './posts/upper.directive';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusFederationDriver,
      typePaths: [join(__dirname, '**/*.graphql')],
      transformSchema: (schema) => upperDirectiveTransformer(schema, 'upper'),
      federationMetadata: true,
    }),
    PostsModule,
  ],
})
export class AppModule {}
