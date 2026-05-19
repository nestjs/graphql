import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriver } from '../../../lib/drivers/index.js';
import { ApolloGatewayDriverConfig } from '../../../lib/interfaces/index.js';
import { ConfigModule } from './config/config.module.js';
import { ConfigService } from './config/config.service.js';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      useFactory: async (configService: ConfigService) => ({
        ...configService.createGqlOptions(),
      }),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
