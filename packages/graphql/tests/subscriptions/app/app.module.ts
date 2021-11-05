import { Module } from '@nestjs/common';
import { DynamicModule } from '@nestjs/common/interfaces';
import { GraphQLModule } from '../../../lib';
import { GqlModuleOptions } from '../../../lib/interfaces/gql-module-options.interface';
import { NotificationModule } from './notification.module';

export type AppModuleConfig = {
  context?: GqlModuleOptions['context'];
  subscriptions?: GqlModuleOptions['subscriptions'];
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
          subscriptions: options?.subscriptions,
        }),
      ],
    };
  }
}
