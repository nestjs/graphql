import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ApolloDriverConfig } from '../../lib/index.js';
import { ApolloDriver } from '../../lib/drivers/index.js';
import { CatsModule } from './cats/cats.module.js';

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: [join(import.meta.dirname, '**', '*.graphql')],
    }),
  ],
})
export class ApplicationModule {}
