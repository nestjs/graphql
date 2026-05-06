import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriverConfig } from '../../../lib/index.js';
import { ApolloGatewayDriver } from '../../../lib/drivers/index.js';
import { ConfigModule } from './config/config.module.js';
import { ConfigService } from './config/config.service.js';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      useClass: ConfigService,
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
