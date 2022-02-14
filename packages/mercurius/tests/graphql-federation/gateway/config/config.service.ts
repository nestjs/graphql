import { Injectable } from '@nestjs/common';
import {
  MercuriusDriverConfig,
  MercuriusDriverConfigFactory,
} from '../../../../lib';
import { noOptionsPlugin } from '../../../mock-plugin/common/mock.mercurius-driver-plugin';

@Injectable()
export class ConfigService implements MercuriusDriverConfigFactory {
  public createGqlOptions(): Partial<MercuriusDriverConfig> {
    return {
      gateway: {
        services: [
          { name: 'users', url: 'http://localhost:3011/graphql' },
          { name: 'posts', url: 'http://localhost:3012/graphql' },
        ],
      },
      plugins: [noOptionsPlugin],
    };
  }
}
