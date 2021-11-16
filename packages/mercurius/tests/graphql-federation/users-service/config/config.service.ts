import { Injectable } from '@nestjs/common';
import { join } from 'path';
import {
  MercuriusDriverConfig,
  MercuriusDriverConfigFactory,
} from '../../../../lib';

@Injectable()
export class ConfigService implements MercuriusDriverConfigFactory {
  public createGqlOptions(): Partial<MercuriusDriverConfig> {
    return {
      typePaths: [join(__dirname, '../**/*.graphql')],
      federationMetadata: true,
    };
  }
}
