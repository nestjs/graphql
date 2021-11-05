import { Module } from '@nestjs/common';
import {
  GqlModuleOptions,
  GqlOptionsFactory,
  GraphQLModule,
} from '@nestjs/graphql-experimental';
import { join } from 'path';
import { ApolloGraphQLDriverAdapter } from '../../lib/adapters';
import { CatsModule } from './cats/cats.module';

class ConfigService implements GqlOptionsFactory {
  createGqlOptions(): GqlModuleOptions {
    return {
      typePaths: [join(__dirname, '**', '*.graphql')],
    };
  }
}

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRootAsync({
      adapter: ApolloGraphQLDriverAdapter,
      useClass: ConfigService,
    }),
  ],
})
export class AsyncClassApplicationModule {}
