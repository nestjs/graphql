import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql-experimental';
import { join } from 'path';
import { MercuriusDriverConfig } from '../../lib';
import { MercuriusDriver } from '../../lib/drivers';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      typePaths: [join(__dirname, '**', '*.graphql')],
      useGlobalPrefix: true,
    }),
  ],
})
export class GlobalPrefixModule {}
