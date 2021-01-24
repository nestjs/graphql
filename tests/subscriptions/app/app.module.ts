import { Module } from '@nestjs/common';
import {
  GqlModuleOptions,
  SubscriptionConfig,
} from '../../../lib/interfaces/gql-module-options.interface';
import { DynamicModule } from '@nestjs/common/interfaces';
import { NotificationModule } from './notification.module';
import { GraphQLModule } from '../../../lib';

export type AppModuleConfig = {
  context?: GqlModuleOptions['context'];
  subscriptions?: SubscriptionConfig;
};

@Module({})
export class AppModule {
  static forRoot(options?: AppModuleConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        NotificationModule,
        GraphQLModule.forRoot({
          debug: false,
          context: options?.context,
          autoSchemaFile: true,
          installSubscriptionHandlers: true,
          subscriptions: options?.subscriptions,
        }),
      ],
    };
  }
}
