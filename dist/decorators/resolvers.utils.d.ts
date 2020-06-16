import { Type } from '@nestjs/common';
import { Resolver } from '../enums/resolver.enum';
import { ResolverTypeFn } from './resolver.decorator';
export declare function addResolverMetadata(
  resolver: Resolver | string | undefined,
  name: string | undefined,
  target?: Record<string, any> | Function,
  key?: string | symbol,
  descriptor?: any,
): void;
export declare function getClassName(
  nameOrType: string | Function | Type<any>,
): any;
export declare function getResolverTypeFn(
  nameOrType: Function,
  target: Function,
): ResolverTypeFn;
export declare function getClassOrUndefined(
  typeOrFunc: Function | Type<any>,
): any;
