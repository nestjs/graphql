import { Injectable } from '@nestjs/common';
import {
  ApolloGatewayAdapterOptions,
  GatewayOptionsFactory,
} from '../../../../lib';

@Injectable()
export class ConfigService implements GatewayOptionsFactory {
  public createGqlOptions(): Partial<ApolloGatewayAdapterOptions> {
    return {
      gateway: {
        serviceList: [
          { name: 'users', url: 'http://localhost:3001/graphql' },
          { name: 'posts', url: 'http://localhost:3002/graphql' },
        ],
      },
    };
  }
}
