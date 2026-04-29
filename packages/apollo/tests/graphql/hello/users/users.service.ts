import { Inject, Injectable, Scope } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';

@Injectable({ scope: Scope.REQUEST })
export class UsersService {
  static COUNTER = 0;
  static REQUEST_CONTEXTS: any[] = [];

  constructor(
    @Inject('META') private readonly meta,
    @Inject(CONTEXT) private readonly context: any,
  ) {
    UsersService.COUNTER++;
    UsersService.REQUEST_CONTEXTS.push(this.context);
  }

  findById(id: string) {
    return { id };
  }
}
