import { DynamicModule, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig } from '../../../lib';
import { ApolloFederationDriver } from '../../../lib/drivers';
import { NotificationModule } from './notification.module';

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
