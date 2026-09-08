import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GuardCallsService {
  readonly roots: unknown[] = [];

  reset() {
    this.roots.length = 0;
  }
}

@Injectable()
export class RecordingGuard implements CanActivate {
  constructor(private readonly guardCalls: GuardCallsService) {}

  canActivate(context: ExecutionContext): boolean {
    this.guardCalls.roots.push(GqlExecutionContext.create(context).getRoot());
    return true;
  }
}
