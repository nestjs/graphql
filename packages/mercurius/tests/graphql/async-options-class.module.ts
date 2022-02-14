import { Module } from '@nestjs/common';
import { GqlOptionsFactory, GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { MercuriusDriverConfig } from '../../lib';
import { MercuriusDriver } from '../../lib/drivers';
import { noOptionsPlugin } from '../mock-plugin/common/mock.mercurius-driver-plugin';
import { CatsModule } from './cats/cats.module';

class ConfigService implements GqlOptionsFactory {
  createGqlOptions(): MercuriusDriverConfig {
    return {
      typePaths: [join(__dirname, '**', '*.graphql')],
      plugins: [noOptionsPlugin],
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
