import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusGatewayDriver } from '../../../lib/drivers';

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
    }),
  ],
})
export class AppModule {}
