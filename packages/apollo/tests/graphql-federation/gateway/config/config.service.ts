import { Injectable } from '@nestjs/common';
import {
  ApolloGatewayDriverConfig,
  ApolloGatewayDriverConfigFactory,
} from '../../../../lib/index.js';
import { supergraphSdl } from '../supergraph-sdl.js';

@Injectable()
export class ConfigService implements ApolloGatewayDriverConfigFactory {
  public createGqlOptions(): Partial<ApolloGatewayDriverConfig> {
    return {
      gateway: {
        supergraphSdl,
      },
    };
  }
}
