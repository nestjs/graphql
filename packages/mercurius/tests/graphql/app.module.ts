import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { MercuriusDriverConfig } from '../../lib';
import { MercuriusDriver } from '../../lib/drivers';
import { optionsPlugin } from '../mock-plugin/common/mock.mercurius-driver-plugin';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      typePaths: [join(__dirname, '**', '*.graphql')],
      plugins: [optionsPlugin],
    }),
  ],
})
export class ApplicationModule {}
