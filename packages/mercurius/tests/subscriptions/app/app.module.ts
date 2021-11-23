import { Module } from '@nestjs/common';
import { DynamicModule } from '@nestjs/common/interfaces';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriverConfig } from '../../../lib';
import { MercuriusDriver } from '../../../lib/drivers';
import { NotificationModule } from './notification.module';

export type AppModuleConfig = {
  context?: MercuriusDriverConfig['context'];
  subscription?: MercuriusDriverConfig['subscription'];
};

@Module({})
export class AppModule {
  static forRoot(options?: AppModuleConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        NotificationModule,
        GraphQLModule.forRoot<MercuriusDriverConfig>({
          driver: MercuriusDriver,
          context: options?.context,
          autoSchemaFile: true,
          subscription: options?.subscription,
        }),
      ],
    };
  }
}
