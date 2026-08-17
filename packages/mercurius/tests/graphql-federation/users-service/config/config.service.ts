import { Injectable } from '@nestjs/common';
import { join } from 'path';
import {
  MercuriusDriverConfigFactory,
  MercuriusFederationDriverConfig,
} from '../../../../lib/index.js';

@Injectable()
export class ConfigService implements MercuriusDriverConfigFactory {
  public createGqlOptions(): Partial<MercuriusFederationDriverConfig> {
    return {
      typePaths: [join(import.meta.dirname, '../**/*.graphql')],
    };
  }
}
