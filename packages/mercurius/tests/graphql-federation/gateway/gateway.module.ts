import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusGatewayDriver } from '../../../lib/drivers';
import { optionsPlugin } from '../../mock-plugin/common/mock.mercurius-driver-plugin';

@Module({
  imports: [
    GraphQLModule.forRoot({
      driver: MercuriusGatewayDriver,
      gateway: {
        services: [
          { name: 'users', url: 'http://localhost:3011/graphql' },
          { name: 'posts', url: 'http://localhost:3012/graphql' },
        ],
      },
      plugins: [optionsPlugin],
    }),
  ],
})
export class AppModule {}
