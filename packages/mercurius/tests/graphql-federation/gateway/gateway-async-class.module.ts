import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriverConfig } from '../../../lib/index.js';
import { MercuriusGatewayDriver } from '../../../lib/drivers/index.js';
import { ConfigModule } from './config/config.module.js';
import { ConfigService } from './config/config.service.js';

@Module({
  imports: [
    GraphQLModule.forRootAsync<MercuriusDriverConfig>({
      driver: MercuriusGatewayDriver,
      useClass: ConfigService,
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
