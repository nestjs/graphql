/**
 * Cache instance used by the underlying `DataLoader` to store the values
 * resolved (or being resolved) for a given key.
 *
 * @publicApi
 */
export interface BatchLoaderCacheMap<TKey = any, TValue = any> {
  get(key: TKey): TValue | void;
  set(key: TKey, value: TValue): any;
  delete(key: TKey): any;
  clear(): any;
}

/**
 * Options forwarded to the `DataLoader` instance created for a
 * `@BatchResolveField()` method.
 *
 * This is a structural subset of `DataLoader.Options`, redefined here so that
 * `@nestjs/graphql` does not depend on the type declarations of `dataloader`,
 * which is an optional peer dependency.
 *
 * @publicApi
 */
export interface BatchLoaderOptions<TParent = any, TCacheKey = TParent> {
  /**
   * Set to `false` to disable memoization of the values resolved for a given
   * parent within a single request.
   * @default true
   */
  cache?: boolean;
  /**
   * Limits the number of parents handed over to the batch method in a single
   * call. Larger batches are split into several calls.
   * @default Infinity
   */
  maxBatchSize?: number;
  /**
   * Schedules when an accumulated batch is dispatched. Defaults to the
   * scheduler used by `dataloader` itself (end of the current event loop tick).
   */
  batchScheduleFn?: (callback: () => void) => void;
  /**
   * Produces the cache key for a given parent. Defaults to the parent object
   * itself, which means values are memoized by reference.
   */
  cacheKeyFn?: (parent: TParent) => TCacheKey;
  /**
   * Custom cache instance. Set to `null` to opt out of the default `Map`.
   */
  cacheMap?: BatchLoaderCacheMap<TCacheKey, Promise<any>> | null;
  /**
   * Name reported by `dataloader` (e.g., in error messages).
   */
  name?: string | null;
}
