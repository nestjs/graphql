import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ApolloDriverConfig } from '../../lib';
import { ApolloDriver } from '../../lib/drivers';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: async () => ({
        typePaths: [join(__dirname, '**', '*.graphql')],
        useGlobalPrefix: true,
      }),
    }),
  ],
})
export class GlobalPrefixAsyncOptionsModule {}
