import { Type } from '@nestjs/common';
import 'reflect-metadata';
export declare type ResolverTypeFn = (of?: void) => Type<any>;
export interface ResolverOptions {
  isAbstract?: boolean;
}
export declare function Resolver(): MethodDecorator & ClassDecorator;
export declare function Resolver(
  name: string,
): MethodDecorator & ClassDecorator;
export declare function Resolver(
  options: ResolverOptions,
): MethodDecorator & ClassDecorator;
export declare function Resolver(
  classType: Type<any>,
  options?: ResolverOptions,
): MethodDecorator & ClassDecorator;
export declare function Resolver(
  typeFunc: ResolverTypeFn,
  options?: ResolverOptions,
): MethodDecorator & ClassDecorator;
