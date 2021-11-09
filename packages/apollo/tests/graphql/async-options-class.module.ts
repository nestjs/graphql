import { Module } from '@nestjs/common';
import { GqlOptionsFactory, GraphQLModule } from '@nestjs/graphql-experimental';
import { join } from 'path';
import { ApolloAdapterOptions } from '../../lib';
import { ApolloGraphQLAdapter } from '../../lib/adapters';
import { CatsModule } from './cats/cats.module';

class ConfigService implements GqlOptionsFactory {
  createGqlOptions(): ApolloAdapterOptions {
    return {
      typePaths: [join(__dirname, '**', '*.graphql')],
    };
  }
}

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRootAsync<ApolloAdapterOptions>({
      adapter: ApolloGraphQLAdapter,
      useClass: ConfigService,
    }),
  ],
})
export class AsyncClassApplicationModule {}
