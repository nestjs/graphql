import { Module } from '@nestjs/common';
import {
  GqlModuleOptions,
  GqlOptionsFactory,
  GraphQLModule,
} from '@nestjs/graphql-experimental';
import { join } from 'path';
import { ApolloGraphQLAdapter } from '../../lib/adapters';
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
      adapter: ApolloGraphQLAdapter,
      useClass: ConfigService,
    }),
  ],
})
export class AsyncClassApplicationModule {}
