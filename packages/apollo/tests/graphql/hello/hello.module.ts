import { DynamicModule, Inject, Module, Provider, Scope } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql-experimental';
import { join } from 'path';
import { ApolloGraphQLDriverAdapter } from '../../../lib/adapters';
import { HelloResolver } from './hello.resolver';
import { HelloService } from './hello.service';
import { UsersService } from './users/users.service';

@Module({
  imports: [
    GraphQLModule.forRoot({
      adapter: ApolloGraphQLDriverAdapter,
      typePaths: [join(__dirname, '*.graphql')],
    }),
  ],
  providers: [
    HelloResolver,
    HelloService,
    UsersService,
    {
      provide: 'REQUEST_ID',
      useFactory: () => 1,
      scope: Scope.REQUEST,
    },
  ],
})
export class HelloModule {
  constructor(@Inject('META') private readonly meta) {}

  static forRoot(meta: Provider): DynamicModule {
    return {
      module: HelloModule,
      providers: [meta],
    };
  }
}
