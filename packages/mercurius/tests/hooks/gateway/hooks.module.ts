import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusGatewayDriver } from '../../../lib/drivers';
import { MercuriusGatewayDriverConfig } from '../../../lib/interfaces/mercurius-gateway-driver-config.interface';
import { GqlConfigService } from './graphql.config';

@Module({
  imports: [
    GraphQLModule.forRootAsync<MercuriusGatewayDriverConfig>({
      driver: MercuriusGatewayDriver,
      useClass: GqlConfigService,
    }),
  ],
})
export class ApplicationModule {}
