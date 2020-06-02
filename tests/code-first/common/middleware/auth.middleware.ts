import {
  MiddlewareInterface,
  MiddlewareAction,
  NextFn,
} from '../../../../lib/interfaces';
import { Injectable } from '@nestjs/common';

export type Auth = (context: any) => void;

@Injectable()
export class AuthMiddleware implements MiddlewareInterface {
  constructor(private readonly assertValid: Auth = () => true) {}

  async use(
    { source, context, info }: MiddlewareAction<any, { username?: string }>,
    next: NextFn,
  ) {
    this.assertValid(context);

    return next();
  }
}
