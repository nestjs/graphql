import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusGatewayDriver } from '../../../lib/drivers';
import { MercuriusDriverConfig } from '../../../lib/interfaces';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';

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
