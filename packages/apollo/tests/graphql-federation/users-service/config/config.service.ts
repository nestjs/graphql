import { Injectable } from '@nestjs/common';
import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled';
import { join } from 'path';
import {
  ApolloDriverConfig,
  ApolloDriverConfigFactory,
} from '../../../../lib/index.js';

@Injectable()
export class ConfigService implements ApolloDriverConfigFactory {
  public createGqlOptions(): Partial<ApolloDriverConfig> {
    return {
      typePaths: [join(import.meta.dirname, '../**/*.graphql')],
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    };
  }
}
