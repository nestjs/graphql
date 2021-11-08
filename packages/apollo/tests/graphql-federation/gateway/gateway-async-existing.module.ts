import { Module } from '@nestjs/common';
import { GraphQLGatewayModule } from '@nestjs/graphql-experimental';
import { ApolloGatewayGraphQLAdapter } from '../../../lib/adapters';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';

@Module({
  imports: [
    GraphQLGatewayModule.forRootAsync({
      adapter: ApolloGatewayGraphQLAdapter,
      useExisting: ConfigService,
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
