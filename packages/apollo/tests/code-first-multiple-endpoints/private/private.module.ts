import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig } from '../../../lib';
import { ApolloDriver } from '../../../lib/drivers';
import { AuthorResolver } from './author.resolver';
import { BookResolver } from './book.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      path: '/graphql/admin',
      includeStacktraceInErrorResponses: false,
      autoSchemaFile: true,
      include: [AuthorResolver, BookResolver],
      buildSchemaOptions: {
        filterUnusedTypes: true,
      },
    }),
    AuthorResolver,
    BookResolver,
  ],
})
export class PrivateModule {}
