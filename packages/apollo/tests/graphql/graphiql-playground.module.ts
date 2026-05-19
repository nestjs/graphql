import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ApolloDriverConfig } from '../../lib/index.js';
import { ApolloDriver } from '../../lib/drivers/index.js';
import { GraphiQLOptions } from '../../lib/graphiql/interfaces/graphiql-options.interface.js';
import { CatsModule } from './cats/cats.module.js';

@Module({
  imports: [CatsModule],
})
export class GraphiQLPlaygroundModule {
  static withDefaults() {
    return {
      module: GraphiQLPlaygroundModule,
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          csrfPrevention: false,
          typePaths: [join(import.meta.dirname, '**', '*.graphql')],
        }),
      ],
    };
  }

  static withPlaygroundEnabled() {
    return {
      module: GraphiQLPlaygroundModule,
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          csrfPrevention: false,
          playground: true,
          typePaths: [join(import.meta.dirname, '**', '*.graphql')],
        }),
      ],
    };
  }

  static withEnabled() {
    return {
      module: GraphiQLPlaygroundModule,
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          csrfPrevention: false,
          graphiql: true,
          typePaths: [join(import.meta.dirname, '**', '*.graphql')],
        }),
      ],
    };
  }

  static withEnabledAndCustomized(options: GraphiQLOptions) {
    return {
      module: GraphiQLPlaygroundModule,
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          csrfPrevention: false,
          typePaths: [join(import.meta.dirname, '**', '*.graphql')],
          graphiql: options,
        }),
      ],
    };
  }
}
