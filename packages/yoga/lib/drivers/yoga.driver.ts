import { Injectable } from '@nestjs/common';
import { GqlSubscriptionService, SubscriptionConfig } from '@nestjs/graphql';
import { printSchema } from 'graphql';

import { YogaDriverConfig } from '../interfaces';
import { YogaBaseDriver } from './yoga-base.driver';
import type { ExecutionParams } from 'subscriptions-transport-ws';
import { WebSocket } from 'ws';

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
      if (
        opts.subscriptions?.['graphql-ws'] != null &&
        opts.subscriptions?.['graphql-ws'] !== false
      ) {
        opts.subscriptions['graphql-ws'] =
          typeof opts.subscriptions['graphql-ws'] === 'object'
            ? opts.subscriptions['graphql-ws']
            : {};
        opts.subscriptions['graphql-ws'].onSubscribe = async (ctx, msg) => {
          const {
            schema,
            execute,
            subscribe,
            contextFactory,
            parse,
            validate,
          } = this.yogaInstance.getEnveloped(ctx);

          const args = {
            schema,
            operationName: msg.payload.operationName,
            document: parse(msg.payload.query),
            variableValues: msg.payload.variables,
            contextValue: await contextFactory({ execute, subscribe }),
          };

          const errors = validate(args.schema, args.document);
          if (errors.length) return errors;
          return args;
        };
      }
      if (
        opts.subscriptions?.['subscriptions-transport-ws'] != null &&
        opts.subscriptions?.['subscriptions-transport-ws'] !== false
      ) {
        opts.subscriptions['subscriptions-transport-ws'] =
          typeof opts.subscriptions['subscriptions-transport-ws'] === 'object'
            ? opts.subscriptions['subscriptions-transport-ws']
            : {};
        opts.subscriptions['subscriptions-transport-ws'].onOperation = async (
          _msg: any,
          params: ExecutionParams,
          socket: WebSocket,
        ) => {
          const {
            schema,
            execute,
            subscribe,
            contextFactory,
            parse,
            validate,
          } = this.yogaInstance.getEnveloped(socket);

          const args = {
            schema,
            operationName: params.operationName,
            document:
              typeof params.query === 'string'
                ? parse(params.query)
                : params.query,
            variableValues: params.variables,
            contextValue: await contextFactory({ execute, subscribe }),
          };

          const errors = validate(args.schema, args.document);
          if (errors.length) return errors;
          return args;
        };
      }

      this._subscriptionService = new GqlSubscriptionService(
        {
          schema: opts.schema,
          path: opts.path,
          context: opts.context,
          execute: (...args) => {
            const contextValue = args[4] || args[0].contextValue;
            return contextValue.execute(...args);
          },
          subscribe: (...args) => {
            const contextValue = args[4] || args[0].contextValue;
            return contextValue.subscribe(...args);
          },
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
