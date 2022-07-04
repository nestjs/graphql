import { Module } from '@nestjs/common';
import { DynamicModule } from '@nestjs/common/interfaces';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusFederationDriver, MercuriusFederationDriverConfig } from '../../../lib';
import { NotificationModule } from './notification.module';

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
          federationMetadata: true,
          autoSchemaFile: true,
          subscription: options?.subscription,
        }),
      ],
    };
  }
}
