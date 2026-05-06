import { Module } from '@nestjs/common';
import { GqlOptionsFactory, GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { MercuriusDriverConfig } from '../../lib/index.js';
import { MercuriusDriver } from '../../lib/drivers/index.js';
import { CatsModule } from './cats/cats.module.js';

class ConfigService implements GqlOptionsFactory {
  createGqlOptions(): MercuriusDriverConfig {
    return {
      typePaths: [join(import.meta.dirname, '**', '*.graphql')],
    };
  }
}

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRootAsync<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      useClass: ConfigService,
    }),
  ],
})
export class AsyncClassApplicationModule {}
