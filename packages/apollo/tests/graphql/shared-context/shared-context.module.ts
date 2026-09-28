import { DynamicModule, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig } from '../../../lib/index.js';
import { ApolloDriver } from '../../../lib/drivers/index.js';
import { SharedContextResolver } from './shared-context.resolver.js';

@Module({})
export class SharedContextModule {
  static forRoot(context: ApolloDriverConfig['context']): DynamicModule {
    return {
      module: SharedContextModule,
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          context,
        }),
      ],
      providers: [SharedContextResolver],
    };
  }
}
