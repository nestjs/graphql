import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ApolloDriver } from '../../lib/drivers/index.js';
import { CatsModule } from './cats/cats.module.js';

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      typePaths: [join(import.meta.dirname, '**', '*.graphql')],
      sortSchema: true,
    }),
  ],
})
export class SortSchemaModule {}
