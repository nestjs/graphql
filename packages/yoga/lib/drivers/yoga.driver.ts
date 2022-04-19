import { Injectable } from '@nestjs/common';
import { printSchema } from 'graphql';

import { YogaDriverConfig } from '../interfaces';
import { YogaBaseDriver } from './yoga-base.driver';

@Injectable()
export class YogaDriver extends YogaBaseDriver {
  public async start(options: YogaDriverConfig) {
    const opts = await this.graphQlFactory.mergeWithSchema<YogaDriverConfig>(
      options,
    );

    if (opts.definitions && opts.definitions.path) {
      await this.graphQlFactory.generateDefinitions(
        printSchema(opts.schema),
        opts,
      );
    }

    await super.start(opts);
  }
}
