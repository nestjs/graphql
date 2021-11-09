import { Injectable } from '@nestjs/common';
import { join } from 'path';
import {
  ApolloAdapterOptions,
  ApolloAdapterOptionsFactory,
} from '../../lib/interfaces';

@Injectable()
export class ConfigService implements ApolloAdapterOptionsFactory {
  createGqlOptions(): ApolloAdapterOptions {
    return {
      typePaths: [join(__dirname, '**', '*.graphql')],
    };
  }
}
