import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ApolloDriverConfig } from '../../lib';
import { ApolloDriver } from '../../lib/drivers';
import { GraphiQLOptions } from '../../lib/graphiql/interfaces/graphiql-options.interface';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class GraphiQLPlaygroundModule {
  static withEnabled() {
    return {
      module: GraphiQLPlaygroundModule,
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          csrfPrevention: false,
          graphiql: true,
          typePaths: [join(__dirname, '**', '*.graphql')],
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
          typePaths: [join(__dirname, '**', '*.graphql')],
          graphiql: options,
        }),
      ],
    };
  }
}
