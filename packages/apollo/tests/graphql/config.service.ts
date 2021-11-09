import { Injectable } from '@nestjs/common';
import { join } from 'path';
import {
  ApolloDriverConfig,
  ApolloDriverConfigFactory,
} from '../../lib/interfaces';

@Injectable()
export class ConfigService implements ApolloDriverConfigFactory {
  createGqlOptions(): ApolloDriverConfig {
    return {
      typePaths: [join(__dirname, '**', '*.graphql')],
    };
  }
}
