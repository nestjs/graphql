import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { MercuriusDriverConfig } from '../../lib';
import { MercuriusDriver } from '../../lib/drivers';
import { noOptionsPlugin } from '../mock-plugin/common/mock.mercurius-driver-plugin';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRootAsync<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      useFactory: async () => ({
        typePaths: [join(__dirname, '**', '*.graphql')],
        plugins: [noOptionsPlugin],
      }),
    }),
  ],
})
export class AsyncApplicationModule {}
