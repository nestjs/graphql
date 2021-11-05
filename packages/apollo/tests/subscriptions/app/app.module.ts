import { Module } from '@nestjs/common';
import { DynamicModule } from '@nestjs/common/interfaces';
import { GraphQLModule } from '@nestjs/graphql-experimental';
import { GqlModuleOptions } from '@nestjs/graphql-experimental/interfaces/gql-module-options.interface';
import { ApolloGraphQLDriverAdapter } from '../../../lib/adapters';
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
          adapter: ApolloGraphQLDriverAdapter,
          debug: false,
          context: options?.context,
          autoSchemaFile: true,
          subscriptions: options?.subscriptions,
        }),
      ],
    };
  }
}
