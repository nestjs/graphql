import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusGatewayDriver } from '../../../lib/drivers/index.js';
import { MercuriusDriverConfig } from '../../../lib/interfaces/index.js';
import { ConfigModule } from './config/config.module.js';
import { ConfigService } from './config/config.service.js';

@Module({
  imports: [
    GraphQLModule.forRootAsync<MercuriusDriverConfig>({
      driver: MercuriusGatewayDriver,
      useFactory: async (configService: ConfigService) => ({
        ...configService.createGqlOptions(),
      }),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
