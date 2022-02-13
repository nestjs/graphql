import { Injectable } from '@nestjs/common';
import { join } from 'path';
import {
  MercuriusDriverConfig,
  MercuriusDriverConfigFactory,
} from '../../lib/interfaces';
import { altairPlugin } from './common/plugins/altair.plugin';

@Injectable()
export class ConfigService implements MercuriusDriverConfigFactory {
  createGqlOptions(): MercuriusDriverConfig {
    return {
      typePaths: [join(__dirname, '**', '*.graphql')],
      plugins: [altairPlugin],
    };
  }
}
