import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql-experimental';
import { ApolloGatewayDriver } from '../../../lib/drivers';

@Module({
  imports: [
    GraphQLModule.forRoot({
      driver: ApolloGatewayDriver,
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
