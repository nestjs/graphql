import { SetMetadata, Type } from '@nestjs/common';
import {
  isFunction,
  isObject,
  isString,
} from '@nestjs/common/utils/shared.utils.js';
import {
  BATCH_RESOLVER_METADATA,
  FIELD_RESOLVER_MIDDLEWARE_METADATA,
  RESOLVER_NAME_METADATA,
  RESOLVER_PROPERTY_METADATA,
} from '../graphql.constants.js';
import { BatchLoaderOptions } from '../interfaces/batch-loader-options.interface.js';
import { ReturnTypeFunc } from '../interfaces/return-type-func.interface.js';
import { UndefinedBatchFieldTypeError } from '../schema-builder/errors/undefined-batch-field-type.error.js';
import { LazyMetadataStorage } from '../schema-builder/storages/lazy-metadata.storage.js';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage.js';
import { reflectTypeFromMetadata } from '../utils/reflection.utilts.js';
import { ResolveFieldOptions } from './resolve-field.decorator.js';

/**
 * Interface defining options that can be passed to the `@BatchResolveField()`
 * decorator.
 *
 * @publicApi
 */
export type BatchResolveFieldOptions<
  TParent = any,
  TKey = any,
> = ResolveFieldOptions & {
  /**
   * Derives the key a parent is looked up with in the `Map` returned by the
   * batch method. Without it, the parent objects handed over to the method are
   * used as keys (reference equality).
   * @example keyBy: (post) => post.id
   */
  keyBy?: (parent: TParent) => TKey;
  /**
   * Options forwarded to the underlying `DataLoader` instance.
   */
  dataLoader?: BatchLoaderOptions<TParent>;
};

/**
 * Metadata attached to a method decorated with `@BatchResolveField()`.
 */
export interface BatchFieldMetadata {
  keyBy?: (parent: any) => any;
  dataLoader?: BatchLoaderOptions;
}

/**
 * Batch field resolver (method) decorator.
 *
 * Registers a field resolver that is handed **every parent of the current
 * execution layer at once**, instead of being called once per parent. The
 * parents are accumulated by a `DataLoader` scoped to the current request,
 * which turns the usual N+1 round-trips into a single call.
 *
 * The method must return either a `Map` keyed by the parent objects (or by
 * `keyBy(parent)`), or an array holding one entry per parent, in the very same
 * order. Parents missing from the `Map` resolve to `null`.
 *
 * Requires the optional `dataloader` peer dependency to be installed.
 *
 * @example
 * ```ts
 * @Resolver(() => Post)
 * export class PostResolver {
 *   @BatchResolveField(() => [Comment])
 *   async comments(@Parent() posts: Post[]): Promise<Map<Post, Comment[]>> {
 *     const comments = await this.commentsService.findByPostIds(
 *       posts.map((post) => post.id),
 *     );
 *     return new Map(
 *       posts.map((post) => [
 *         post,
 *         comments.filter((comment) => comment.postId === post.id),
 *       ]),
 *     );
 *   }
 * }
 * ```
 *
 * @publicApi
 */
export function BatchResolveField<TParent = any, TKey = any>(
  options?: BatchResolveFieldOptions<TParent, TKey>,
): MethodDecorator;
/**
 * Batch field resolver (method) decorator.
 *
 * @publicApi
 */
export function BatchResolveField<TParent = any, TKey = any>(
  typeFunc?: ReturnTypeFunc,
  options?: BatchResolveFieldOptions<TParent, TKey>,
): MethodDecorator;
/**
 * Batch field resolver (method) decorator.
 *
 * @publicApi
 */
export function BatchResolveField<TParent = any, TKey = any>(
  propertyName?: string,
  options?: BatchResolveFieldOptions<TParent, TKey>,
): MethodDecorator;
/**
 * Batch field resolver (method) decorator.
 *
 * @publicApi
 */
export function BatchResolveField<TParent = any, TKey = any>(
  propertyName?: string,
  typeFunc?: ReturnTypeFunc,
  options?: BatchResolveFieldOptions<TParent, TKey>,
): MethodDecorator;
/**
 * Batch field resolver (method) decorator.
 *
 * @publicApi
 */
export function BatchResolveField(
  propertyNameOrFunc?: string | ReturnTypeFunc | BatchResolveFieldOptions,
  typeFuncOrOptions?: ReturnTypeFunc | BatchResolveFieldOptions,
  batchResolveFieldOptions?: BatchResolveFieldOptions,
): MethodDecorator {
  return (
    target: Function | Record<string, any>,
    key?: string,
    descriptor?: any,
  ) => {
    // eslint-disable-next-line prefer-const
    let [propertyName, typeFunc, options] = isFunction(propertyNameOrFunc)
      ? typeFuncOrOptions &&
        (typeFuncOrOptions as BatchResolveFieldOptions).name
        ? [
            (typeFuncOrOptions as BatchResolveFieldOptions).name,
            propertyNameOrFunc,
            typeFuncOrOptions,
          ]
        : [undefined, propertyNameOrFunc, typeFuncOrOptions]
      : isString(propertyNameOrFunc)
      ? isFunction(typeFuncOrOptions)
        ? [propertyNameOrFunc, typeFuncOrOptions, batchResolveFieldOptions]
        : [propertyNameOrFunc, undefined, typeFuncOrOptions]
      : [
          (propertyNameOrFunc as BatchResolveFieldOptions)?.name,
          undefined,
          propertyNameOrFunc,
        ];

    options = (
      isObject(options)
        ? {
            name: propertyName,
            ...options,
          }
        : propertyName
        ? { name: propertyName }
        : {}
    ) as BatchResolveFieldOptions;

    SetMetadata(RESOLVER_NAME_METADATA, propertyName)(target, key, descriptor);
    SetMetadata(RESOLVER_PROPERTY_METADATA, true)(target, key, descriptor);
    SetMetadata(
      FIELD_RESOLVER_MIDDLEWARE_METADATA,
      (options as BatchResolveFieldOptions).middleware,
    )(target, key, descriptor);
    SetMetadata(BATCH_RESOLVER_METADATA, {
      keyBy: (options as BatchResolveFieldOptions).keyBy,
      dataLoader: (options as BatchResolveFieldOptions).dataLoader,
    } satisfies BatchFieldMetadata)(target, key, descriptor);

    LazyMetadataStorage.store(target.constructor as Type<unknown>, () => {
      if (!isFunction(typeFunc)) {
        // The reflected return type of a batch method is either "Map" or
        // "Promise", neither of which says anything about the schema field.
        throw new UndefinedBatchFieldTypeError(target.constructor.name, key);
      }
      const { options: typeOptions, typeFn } = reflectTypeFromMetadata({
        metadataKey: 'design:returntype',
        prototype: target,
        propertyKey: key,
        explicitTypeFn: typeFunc as ReturnTypeFunc,
        typeOptions: options as any,
      });

      TypeMetadataStorage.addResolverPropertyMetadata({
        kind: 'external',
        methodName: key,
        schemaName: options.name || key,
        target: target.constructor,
        typeFn,
        typeOptions,
        description: options.description,
        deprecationReason: options.deprecationReason,
        complexity: options.complexity,
      });
    });
  };
}
