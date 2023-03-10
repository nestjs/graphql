import { Injectable } from '@nestjs/common';
import {
  ApolloGatewayDriverConfig,
  ApolloGatewayDriverConfigFactory,
} from '../../../../lib';
import { supergraphSdl } from '../supergraph-sdl';

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
