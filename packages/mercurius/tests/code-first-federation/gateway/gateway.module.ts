import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusGatewayDriver } from '../../../lib/drivers';
import { MercuriusGatewayDriverConfig } from '../../../lib/interfaces/mercurius-gateway-driver-config.interface';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusGatewayDriverConfig>({
      driver: MercuriusGatewayDriver,
      gateway: {
        services: [
          { name: 'recipes', url: 'http://localhost:3011/graphql' },
          { name: 'posts', url: 'http://localhost:3012/graphql' },
          { name: 'users', url: 'http://localhost:3013/graphql' },
        ],
      },
    }),
  ],
})
export class AppModule {}
