import { Module } from '@nestjs/common';
import { DynamicModule } from '@nestjs/common/interfaces/index.js';
import { GraphQLModule } from '@nestjs/graphql';
import {
  MercuriusFederationDriver,
  MercuriusFederationDriverConfig,
} from '../../../lib/index.js';
import { NotificationModule } from './notification.module.js';

export type AppModuleConfig = {
  context?: MercuriusFederationDriverConfig['context'];
  subscription?: MercuriusFederationDriverConfig['subscription'];
};

@Module({})
export class AppModule {
  static forRoot(options?: AppModuleConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        NotificationModule,
        GraphQLModule.forRoot<MercuriusFederationDriverConfig>({
          driver: MercuriusFederationDriver,
          context: options?.context,
          autoSchemaFile: true,
          subscription: options?.subscription,
        }),
      ],
    };
  }
}
