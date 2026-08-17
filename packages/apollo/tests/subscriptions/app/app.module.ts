import { Module } from '@nestjs/common';
import { DynamicModule } from '@nestjs/common/interfaces/index.js';
import { GraphQLModule } from '@nestjs/graphql';
import { GqlModuleOptions } from '@nestjs/graphql/interfaces/gql-module-options.interface.js';
import { ApolloDriverConfig } from '../../../lib/index.js';
import { ApolloDriver } from '../../../lib/drivers/index.js';
import { NotificationModule } from './notification.module.js';

export type AppModuleConfig = {
  context?: GqlModuleOptions['context'];
  subscriptions?: ApolloDriverConfig['subscriptions'];
};

@Module({})
export class AppModule {
  static forRoot(options?: AppModuleConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        NotificationModule,
        GraphQLModule.forRoot({
          driver: ApolloDriver,
          includeStacktraceInErrorResponses: false,
          context: options?.context,
          autoSchemaFile: true,
          subscriptions: options?.subscriptions,
        }),
      ],
    };
  }
}
