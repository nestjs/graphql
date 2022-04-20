import { Injectable } from '@nestjs/common';
import { GqlSubscriptionService, SubscriptionConfig } from '@nestjs/graphql';
import { printSchema } from 'graphql';

import { YogaDriverConfig } from '../interfaces';
import { YogaBaseDriver } from './yoga-base.driver';

@Injectable()
export class YogaDriver extends YogaBaseDriver {
  private _subscriptionService?: GqlSubscriptionService;

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

    if (opts.installSubscriptionHandlers || opts.subscriptions) {
      const subscriptionsOptions: SubscriptionConfig = opts.subscriptions || {
        'subscriptions-transport-ws': {},
      };
      this._subscriptionService = new GqlSubscriptionService(
        {
          schema: opts.schema,
          path: opts.path,
          context: opts.context,
          ...subscriptionsOptions,
        },
        this.httpAdapterHost.httpAdapter?.getHttpServer(),
      );
    }
  }

  public async stop() {
    await this._subscriptionService?.stop();
  }
}
