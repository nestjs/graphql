import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver } from '../../../lib/drivers/index.js';
import { MercuriusDriverConfig } from '../../../lib/interfaces/mercurius-driver-config.interface.js';
import { CatsModule } from '../cats/cats.module.js';
import { GqlConfigService } from './graphql.config.js';

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRootAsync<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      useClass: GqlConfigService,
    }),
  ],
})
export class ApplicationModule {}
