import { Injectable } from '@nestjs/common';
import { join } from 'path';
import {
  ApolloDriverConfig,
  ApolloDriverConfigFactory,
} from '../../lib/interfaces/index.js';

@Injectable()
export class ConfigService implements ApolloDriverConfigFactory {
  createGqlOptions(): ApolloDriverConfig {
    return {
      typePaths: [join(import.meta.dirname, '**', '*.graphql')],
    };
  }
}
