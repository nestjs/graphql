import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { GqlModuleOptions, GqlOptionsFactory } from '../../lib';

@Injectable()
export class ConfigService implements GqlOptionsFactory {
  createGqlOptions(): GqlModuleOptions {
    return {
      typePaths: [join(__dirname, '**', '*.graphql')],
    };
  }
}
