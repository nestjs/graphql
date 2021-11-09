import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql-experimental';
import { ApolloGatewayAdapterOptions } from '../../../lib';
import { ApolloGatewayGraphQLAdapter } from '../../../lib/adapters';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloGatewayAdapterOptions>({
      adapter: ApolloGatewayGraphQLAdapter,
      useExisting: ConfigService,
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
