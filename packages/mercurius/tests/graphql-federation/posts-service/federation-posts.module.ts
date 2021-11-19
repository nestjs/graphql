import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql-experimental';
import { join } from 'path';
import { MercuriusDriverConfig, MercuriusFederationDriver } from '../../../lib';
import { PostsModule } from './posts/posts.module';
import { UpperCaseDirective } from './posts/upper.directive';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusFederationDriver,
      typePaths: [join(__dirname, '**/*.graphql')],
      schemaDirectives: {
        upper: UpperCaseDirective,
      },
      federationMetadata: true,
    }),
    PostsModule,
  ],
})
export class AppModule {}
