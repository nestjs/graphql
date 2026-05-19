import { DynamicModule, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig } from '../../../lib/index.js';
import { ApolloFederationDriver } from '../../../lib/drivers/index.js';
import { NotificationModule } from './notification.module.js';

export type FederationAppModuleConfig = {
  subscriptions?: ApolloDriverConfig['subscriptions'];
};

@Module({})
export class FederationAppModule {
  static forRoot(options?: FederationAppModuleConfig): DynamicModule {
    return {
      module: FederationAppModule,
      imports: [
        NotificationModule,
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloFederationDriver,
          autoSchemaFile: true,
          includeStacktraceInErrorResponses: false,
          subscriptions: options?.subscriptions,
        }),
      ],
    };
  }
}
