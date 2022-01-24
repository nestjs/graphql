import { Injectable } from '@nestjs/common';
import {
  ApolloGatewayDriverConfig,
  ApolloGatewayDriverConfigFactory,
} from '../../../../lib';

@Injectable()
export class ConfigService implements ApolloGatewayDriverConfigFactory {
  public createGqlOptions(): Partial<ApolloGatewayDriverConfig> {
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
