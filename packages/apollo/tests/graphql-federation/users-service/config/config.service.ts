import { Injectable } from '@nestjs/common';
import { ApolloServerPluginInlineTraceDisabled } from 'apollo-server-core';
import { join } from 'path';
import {
  ApolloAdapterOptions,
  ApolloAdapterOptionsFactory,
} from '../../../../lib';

@Injectable()
export class ConfigService implements ApolloAdapterOptionsFactory {
  public createGqlOptions(): Partial<ApolloAdapterOptions> {
    return {
      typePaths: [join(__dirname, '../**/*.graphql')],
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    };
  }
}
