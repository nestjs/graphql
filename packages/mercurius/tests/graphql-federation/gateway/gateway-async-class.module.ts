import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriverConfig } from '../../../lib';
import { MercuriusGatewayDriver } from '../../../lib/drivers';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';

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
