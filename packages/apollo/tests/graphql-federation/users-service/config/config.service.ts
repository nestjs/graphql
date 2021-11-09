import { Injectable } from '@nestjs/common';
import { ApolloServerPluginInlineTraceDisabled } from 'apollo-server-core';
import { join } from 'path';
import { ApolloDriverConfig, ApolloDriverConfigFactory } from '../../../../lib';

@Injectable()
export class ConfigService implements ApolloDriverConfigFactory {
  public createGqlOptions(): Partial<ApolloDriverConfig> {
    return {
      typePaths: [join(__dirname, '../**/*.graphql')],
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    };
  }
}
