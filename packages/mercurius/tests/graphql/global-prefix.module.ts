import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { MercuriusDriverConfig } from '../../lib';
import { MercuriusDriver } from '../../lib/drivers';
import { CatsModule } from './cats/cats.module';
import { altairPlugin } from './common/plugins/altair.plugin';

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      typePaths: [join(__dirname, '**', '*.graphql')],
      useGlobalPrefix: true,
      plugins: [altairPlugin],
    }),
  ],
})
export class GlobalPrefixModule {}
