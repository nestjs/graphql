import { Module } from '@nestjs/common';
import { GraphQLFederationModule } from '@nestjs/graphql-experimental';
import { join } from 'path';
import { ApolloFederationGraphQLAdapter } from '../../../lib/adapters';
import { PostsModule } from './posts/posts.module';
import { UpperCaseDirective } from './posts/upper.directive';

@Module({
  imports: [
    GraphQLFederationModule.forRoot({
      adapter: ApolloFederationGraphQLAdapter,
      typePaths: [join(__dirname, '**/*.graphql')],
      schemaDirectives: {
        upper: UpperCaseDirective,
      },
    }),
    PostsModule,
  ],
})
export class AppModule {}
