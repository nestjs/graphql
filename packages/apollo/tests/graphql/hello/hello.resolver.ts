import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { Guard } from './guards/request-scoped.guard.js';
import { HelloService } from './hello.service.js';
import { Interceptor } from './interceptors/logging.interceptor.js';
import { UsersService } from './users/users.service.js';

@Resolver()
export class HelloResolver {
  static COUNTER = 0;
  constructor(
    private readonly helloService: HelloService,
    private readonly usersService: UsersService,
  ) {
    HelloResolver.COUNTER++;
  }

  @Query()
  @UseGuards(Guard)
  @UseInterceptors(Interceptor)
  getCats(): any[] {
    return this.helloService.getCats();
  }
}
