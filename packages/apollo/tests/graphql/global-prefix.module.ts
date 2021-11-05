import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql-experimental';
import { join } from 'path';
import { ApolloGraphQLAdapter } from '../../lib/adapters';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRoot({
      adapter: ApolloGraphQLAdapter,
      typePaths: [join(__dirname, '**', '*.graphql')],
      useGlobalPrefix: true,
    }),
  ],
})
export class GlobalPrefixModule {}
