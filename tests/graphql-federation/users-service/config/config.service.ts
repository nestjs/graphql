import { Injectable } from '@nestjs/common';
import { GqlModuleOptions, GqlOptionsFactory } from '../../../../lib';
import { join } from 'path';

@Injectable()
export class ConfigService implements GqlOptionsFactory {
  public createGqlOptions(): Partial<GqlModuleOptions> {
    return {
      typePaths: [join(__dirname, '../**/*.graphql')],
    };
  }
}
