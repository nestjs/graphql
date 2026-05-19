import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { MercuriusDriverConfig } from '../../lib/index.js';
import { MercuriusDriver } from '../../lib/drivers/index.js';
import { CatsModule } from './cats/cats.module.js';

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      typePaths: [join(import.meta.dirname, '**', '*.graphql')],
    }),
  ],
})
export class ApplicationModule {}
