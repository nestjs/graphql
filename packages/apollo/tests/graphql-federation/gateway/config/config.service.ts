import { Injectable } from '@nestjs/common';
import {
  GatewayModuleOptions,
  GatewayOptionsFactory,
} from '@nestjs/graphql-experimental';
@Injectable()
export class ConfigService implements GatewayOptionsFactory {
  public createGatewayOptions(): Partial<GatewayModuleOptions> {
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
