import { Module } from '@nestjs/common';
import { GraphQLGatewayModule } from '@nestjs/graphql-experimental';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';

@Module({
  imports: [
    GraphQLGatewayModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        ...configService.createGatewayOptions(),
      }),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
