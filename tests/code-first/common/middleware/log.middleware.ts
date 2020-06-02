import {
  MiddlewareInterface,
  MiddlewareAction,
  NextFn,
} from '../../../../lib/interfaces';
import { Injectable } from '@nestjs/common';

export type Log = (msg) => void;

@Injectable()
export class LogMiddleware implements MiddlewareInterface {
  constructor(private readonly log: Log = console.log) {}

  async use(
    { source, context, info }: MiddlewareAction<any, { username?: string }>,
    next: NextFn,
  ) {
    const username: string = context.username || 'guest';

    this.log(
      `Logging access: ${username} -> ${info.parentType.name}.${
        info.fieldName
      } -> ${source[info.fieldName]}`,
    );

    return next();
  }
}
