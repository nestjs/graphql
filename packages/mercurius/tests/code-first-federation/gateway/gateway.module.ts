import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusGatewayDriver } from '../../../lib/drivers/index.js';
import { MercuriusGatewayDriverConfig } from '../../../lib/interfaces/mercurius-gateway-driver-config.interface.js';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusGatewayDriverConfig>({
      driver: MercuriusGatewayDriver,
      gateway: {
        services: [
          { name: 'recipes', url: 'http://localhost:3211/graphql' },
          { name: 'posts', url: 'http://localhost:3212/graphql' },
          { name: 'users', url: 'http://localhost:3213/graphql' },
        ],
      },
    }),
  ],
})
export class AppModule {}
