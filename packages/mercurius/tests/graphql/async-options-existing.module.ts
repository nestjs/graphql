import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriverConfig } from '../../lib/index.js';
import { MercuriusDriver } from '../../lib/drivers/index.js';
import { CatsModule } from './cats/cats.module.js';
import { ConfigModule } from './config.module.js';
import { ConfigService } from './config.service.js';

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRootAsync<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      imports: [ConfigModule],
      useExisting: ConfigService,
    }),
  ],
})
export class AsyncExistingApplicationModule {}
