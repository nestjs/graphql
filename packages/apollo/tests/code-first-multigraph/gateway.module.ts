import { Module } from '@nestjs/common';
import { GqlModuleOptions, GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '../../lib';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloGatewayDriverConfig & GqlModuleOptions>({
      driver: ApolloGatewayDriver,
      gateway: {
        serviceList: [
          { name: 'user', url: 'http://localhost:3000/user/graphql' },
          { name: 'post', url: 'http://localhost:3000/post/graphql' },
        ],
      },
    }),
  ],
})
export class GatewayModule {}
