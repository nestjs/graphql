import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql-experimental';
import { ApolloGatewayGraphQLAdapter } from '../../../lib/adapters';
import { ApolloGatewayAdapterOptions } from '../../../lib/interfaces';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloGatewayAdapterOptions>({
      adapter: ApolloGatewayGraphQLAdapter,
      useFactory: async (configService: ConfigService) => ({
        ...configService.createGqlOptions(),
      }),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
