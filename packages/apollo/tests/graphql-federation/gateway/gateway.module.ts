import { Module } from '@nestjs/common';
import { GraphQLGatewayModule } from '@nestjs/graphql-experimental';
import { ApolloGatewayGraphQLAdapter } from '../../../lib/adapters';

@Module({
  imports: [
    GraphQLGatewayModule.forRoot({
      adapter: ApolloGatewayGraphQLAdapter,
      gateway: {
        debug: false,
        serviceList: [
          { name: 'users', url: 'http://localhost:3001/graphql' },
          { name: 'posts', url: 'http://localhost:3002/graphql' },
        ],
      },
    }),
  ],
})
export class AppModule {}
