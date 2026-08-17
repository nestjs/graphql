import { Injectable } from '@nestjs/common';
import { join } from 'path';
import {
  MercuriusDriverConfig,
  MercuriusDriverConfigFactory,
} from '../../lib/interfaces/index.js';

@Injectable()
export class ConfigService implements MercuriusDriverConfigFactory {
  createGqlOptions(): MercuriusDriverConfig {
    return {
      typePaths: [join(import.meta.dirname, '**', '*.graphql')],
    };
  }
}
