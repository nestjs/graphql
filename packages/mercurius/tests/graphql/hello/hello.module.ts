import { DynamicModule, Inject, Module, Provider, Scope } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { MercuriusDriver } from '../../../lib/drivers/index.js';
import { HelloResolver } from './hello.resolver.js';
import { HelloService } from './hello.service.js';
import { UsersService } from './users/users.service.js';

@Module({
  imports: [
    GraphQLModule.forRoot({
      driver: MercuriusDriver,
      typePaths: [join(import.meta.dirname, '*.graphql')],
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
