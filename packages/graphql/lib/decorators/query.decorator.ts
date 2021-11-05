import { Type } from '@nestjs/common';
import { isString } from '@nestjs/common/utils/shared.utils';
import 'reflect-metadata';
import { Resolver } from '../enums/resolver.enum';
import { Complexity } from '../interfaces';
import { BaseTypeOptions } from '../interfaces/base-type-options.interface';
import { ReturnTypeFunc } from '../interfaces/return-type-func.interface';
import { UndefinedReturnTypeError } from '../schema-builder/errors/undefined-return-type.error';
import { ResolverTypeMetadata } from '../schema-builder/metadata';
import { LazyMetadataStorage } from '../schema-builder/storages/lazy-metadata.storage';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage';
import { reflectTypeFromMetadata } from '../utils/reflection.utilts';
import { addResolverMetadata } from './resolvers.utils';

/**
 * Interface defining options that can be passed to `@Query()` decorator.
 */
export interface QueryOptions extends BaseTypeOptions {
  /**
   * Name of the query.
   */
  name?: string;
  /**
   * Description of the query.
   */
  description?: string;
  /**
   * Query deprecation reason (if deprecated).
   */
  deprecationReason?: string;
  /**
   * Query complexity options.
   */
  complexity?: Complexity;
}

/**
 * Query handler (method) Decorator. Routes specified query to this method.
 */
export function Query(): MethodDecorator;
/**
 * Query handler (method) Decorator. Routes specified query to this method.
 */
export function Query(name: string): MethodDecorator;
/**
 * Query handler (method) Decorator. Routes specified query to this method.
 */
export function Query(
  typeFunc: ReturnTypeFunc,
  options?: QueryOptions,
): MethodDecorator;
/**
 * Query handler (method) Decorator. Routes specified query to this method.
 */
export function Query(
  nameOrType?: string | ReturnTypeFunc,
  options: QueryOptions = {},
): MethodDecorator {
  return (target: Object | Function, key?: string, descriptor?: any) => {
    const name = isString(nameOrType)
      ? nameOrType
      : (options && options.name) || undefined;

    addResolverMetadata(Resolver.QUERY, name, target, key, descriptor);

    LazyMetadataStorage.store(target.constructor as Type<unknown>, () => {
      if (!nameOrType || isString(nameOrType)) {
        throw new UndefinedReturnTypeError(Query.name, key);
      }

      const { typeFn, options: typeOptions } = reflectTypeFromMetadata({
        metadataKey: 'design:returntype',
        prototype: target,
        propertyKey: key,
        explicitTypeFn: nameOrType,
        typeOptions: options || {},
      });
      const metadata: ResolverTypeMetadata = {
        methodName: key,
        schemaName: options.name || key,
        target: target.constructor,
        typeFn,
        returnTypeOptions: typeOptions,
        description: options.description,
        deprecationReason: options.deprecationReason,
        complexity: options.complexity,
      };
      TypeMetadataStorage.addQueryMetadata(metadata);
    });
  };
}
