import { Injectable } from '@nestjs/common';
import {
  MercuriusGatewayDriverConfig,
  MercuriusGatewayDriverConfigFactory,
} from '../../../../lib';

@Injectable()
export class ConfigService implements MercuriusGatewayDriverConfigFactory {
  public createGqlOptions(): MercuriusGatewayDriverConfig {
    return {
      gateway: {
        services: [
          { name: 'users', url: 'http://localhost:3011/graphql' },
          { name: 'posts', url: 'http://localhost:3012/graphql' },
        ],
      },
    };
  }
}
