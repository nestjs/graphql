import { Injectable } from '@nestjs/common';
import { join } from 'path';
import {
  MercuriusDriverConfigFactory,
  MercuriusFederationDriverConfig,
} from '../../../../lib';

@Injectable()
export class ConfigService implements MercuriusDriverConfigFactory {
  public createGqlOptions(): Partial<MercuriusFederationDriverConfig> {
    return {
      typePaths: [join(__dirname, '../**/*.graphql')],
    };
  }
}
