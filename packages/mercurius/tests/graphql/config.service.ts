import { Injectable } from '@nestjs/common';
import { join } from 'path';
import {
  MercuriusDriverConfig,
  MercuriusDriverConfigFactory,
} from '../../lib/interfaces';
import { noOptionsPlugin } from '../mock-plugin/common/mock.mercurius-driver-plugin';

@Injectable()
export class ConfigService implements MercuriusDriverConfigFactory {
  createGqlOptions(): MercuriusDriverConfig {
    return {
      typePaths: [join(__dirname, '**', '*.graphql')],
      plugins: [noOptionsPlugin],
    };
  }
}
