import { Injectable } from '@nestjs/common';

@Injectable()
export class ResolverDecoratorHost {
  private decorator: (
    fn: (...args: unknown[]) => void,
  ) => (...args: unknown[]) => void;

  setDecorator(
    decorator: (
      fn: (...args: unknown[]) => void,
    ) => (...args: unknown[]) => void,
  ): void {
    this.decorator = decorator;
  }

  getDecorator(): (...args: unknown[]) => void {
    return this.decorator;
  }

  decorate(target: (...args: unknown[]) => void): (...args: unknown[]) => void {
    if (!this.decorator) {
      return target;
    }

    return this.decorator(target);
  }
}
