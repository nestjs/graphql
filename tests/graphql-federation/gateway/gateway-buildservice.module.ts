import { Module } from '@nestjs/common';
import { GraphQLGatewayModule } from '../../../lib/graphql-gateway.module';
import { GRAPHQL_GATEWAY_BUILD_SERVICE } from '../../../lib/graphql.constants';
import { RemoteGraphQLDataSource } from '@apollo/gateway';

@Module({
  providers: [
    {
      provide: GRAPHQL_GATEWAY_BUILD_SERVICE,
      useValue: ({ name, url }) => {
        console.log('BuildService: %s', name);
        return new RemoteGraphQLDataSource({ url });
      },
    },
  ],
  exports: [GRAPHQL_GATEWAY_BUILD_SERVICE],
})
class BuildServiceModule {}

@Module({
  imports: [
    GraphQLGatewayModule.forRootAsync({
      useFactory: async () => ({
        gateway: {
          serviceList: [
            { name: 'users', url: 'http://localhost:3001/graphql' },
            { name: 'posts', url: 'http://localhost:3002/graphql' },
          ],
        },
      }),
      imports: [BuildServiceModule],
      inject: [GRAPHQL_GATEWAY_BUILD_SERVICE],
    }),
  ],
})
export class AppModule {}
