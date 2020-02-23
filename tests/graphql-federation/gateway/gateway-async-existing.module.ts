import { Module } from '@nestjs/common';
import { GraphQLGatewayModule } from '../../../lib/graphql-gateway.module';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';

@Module({
  imports: [
    GraphQLGatewayModule.forRootAsync({
      useExisting: ConfigService,
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
