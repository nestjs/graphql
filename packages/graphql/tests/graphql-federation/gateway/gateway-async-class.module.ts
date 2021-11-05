import { Module } from '@nestjs/common';
import { GraphQLGatewayModule } from '../../../lib';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';

@Module({
  imports: [
    GraphQLGatewayModule.forRootAsync({
      useClass: ConfigService,
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
