import { DynamicModule, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import {
  MercuriusDriver,
  MercuriusFederationDriver,
} from '../../../lib/drivers/index.js';
import { MercuriusDriverConfig } from '../../../lib/index.js';
import { SharedContextResolver } from './shared-context.resolver.js';

@Module({})
export class SharedContextModule {
  static forRoot(
    context: MercuriusDriverConfig['context'],
    driver:
      | typeof MercuriusDriver
      | typeof MercuriusFederationDriver = MercuriusDriver,
  ): DynamicModule {
    return {
      module: SharedContextModule,
      imports: [
        GraphQLModule.forRoot<MercuriusDriverConfig>({
          driver,
          autoSchemaFile: true,
          context,
        }),
      ],
      providers: [SharedContextResolver],
    };
  }
}
