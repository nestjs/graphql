import { Logger } from '@nestjs/common';
import { BatchLoaderOptions } from '../interfaces/batch-loader-options.interface.js';

/**
 * Structural type of a `DataLoader` instance. Declared locally so that the
 * optional `dataloader` peer dependency never leaks into the public type
 * definitions of this package.
 */
interface BatchLoader {
  load(key: any): Promise<any>;
}

type BatchLoaderConstructor = new (
  batchFn: (keys: readonly any[]) => Promise<ArrayLike<any>>,
  options?: BatchLoaderOptions,
) => BatchLoader;

const MISSING_DATALOADER_PACKAGE_MESSAGE =
  'The "dataloader" package is missing. Install it to use the @BatchResolveField() decorator ("$ npm i dataloader").';

const logger = new Logger('BatchResolveField');

let dataLoaderRef: BatchLoaderConstructor | undefined;
let dataLoaderPromise: Promise<BatchLoaderConstructor> | undefined;
let hasLoggedMissingPackage = false;

/**
 * Resolves the optional `dataloader` peer dependency, memoizing both the
 * pending import and the resolved constructor.
 */
export function loadDataLoaderPackage(): Promise<BatchLoaderConstructor> {
  dataLoaderPromise ??= import('dataloader').then(
    (loadedModule) => {
      dataLoaderRef = ((loadedModule as any).default ??
        loadedModule) as BatchLoaderConstructor;
      return dataLoaderRef;
    },
    () => {
      throw new Error(MISSING_DATALOADER_PACKAGE_MESSAGE);
    },
  );
  return dataLoaderPromise;
}

/**
 * Starts resolving `dataloader` while the schema is still being built, so that
 * batch field resolvers can instantiate their loaders synchronously once
 * queries start coming in. A failure here is reported when the field is
 * actually resolved, where it can be surfaced as a GraphQL error.
 */
export function preloadDataLoaderPackage(): void {
  loadDataLoaderPackage().catch((err) => {
    // The very same error is thrown again when the field is resolved, so it
    // still reaches the client - it is logged here to surface it at boot time.
    if (!hasLoggedMissingPackage) {
      hasLoggedMissingPackage = true;
      logger.error(err.message);
    }
  });
}

/**
 * Turns the value returned by a batch method into the positional array
 * `dataloader` expects: one entry per parent, in the very same order.
 */
export function mapBatchResultToParents(
  result: unknown,
  parents: readonly any[],
  keyBy: ((parent: any) => any) | undefined,
  name: string,
): any[] {
  if (result instanceof Map) {
    return keyBy
      ? parents.map((parent) => result.get(keyBy(parent)))
      : parents.map((parent) => result.get(parent));
  }
  if (Array.isArray(result)) {
    if (result.length !== parents.length) {
      throw new Error(
        `"${name}" returned ${result.length} value(s) for ${parents.length} parent(s). A batch field resolver that returns an array must return exactly one entry per parent, in the very same order.`,
      );
    }
    return result;
  }
  throw new Error(
    `"${name}" must return either a "Map" keyed by the parent objects (or by "keyBy(parent)" when that option is set), or an array holding one entry per parent. Received "${
      result === null ? 'null' : typeof result
    }".`,
  );
}

/**
 * Options describing how a single `@BatchResolveField()` method is turned into
 * a regular GraphQL field resolver.
 */
export interface BatchFieldResolverOptions {
  /**
   * Identifier used in error and warning messages, e.g. `PostResolver#author`.
   */
  name: string;
  /**
   * Derives the key a parent is looked up with in the returned `Map`.
   */
  keyBy?: (parent: any) => any;
  /**
   * Options forwarded to the underlying `DataLoader`.
   */
  dataLoader?: BatchLoaderOptions;
}

/**
 * Wraps a batch method - one that receives every parent of the current
 * execution layer at once - into a field resolver that GraphQL can call once
 * per parent. The parents are accumulated by a `DataLoader` created lazily per
 * request (the GraphQL context object) and per field arguments.
 */
export function createBatchFieldResolver(
  batchFn: (...args: any[]) => any,
  options: BatchFieldResolverOptions,
) {
  const { name, keyBy, dataLoader: dataLoaderOptions } = options;
  const loadersByContext = new WeakMap<object, Map<string, BatchLoader>>();
  let hasWarnedAboutContext = false;

  const createLoader = (
    DataLoaderRef: BatchLoaderConstructor,
    args: any,
    context: any,
    info: any,
  ): BatchLoader =>
    new DataLoaderRef(
      async (parents: readonly any[]) =>
        mapBatchResultToParents(
          await batchFn(parents, args, context, info),
          parents,
          keyBy,
          name,
        ),
      dataLoaderOptions,
    );

  const resolveLoader = (
    DataLoaderRef: BatchLoaderConstructor,
    args: any,
    context: any,
    info: any,
  ): BatchLoader => {
    if (!context || typeof context !== 'object') {
      if (!hasWarnedAboutContext) {
        hasWarnedAboutContext = true;
        logger.warn(
          `"${name}" cannot batch its calls because the GraphQL execution context is not an object. Every parent will be resolved in a batch of its own.`,
        );
      }
      return createLoader(DataLoaderRef, args, context, info);
    }
    const argsKey = createArgsKey(args);
    if (argsKey === null) {
      // The arguments cannot be serialized, so there is no way to tell whether
      // two parents were requested with the same ones. Play it safe and give
      // this call a loader of its own.
      return createLoader(DataLoaderRef, args, context, info);
    }
    let loadersByArgs = loadersByContext.get(context);
    if (!loadersByArgs) {
      loadersByArgs = new Map<string, BatchLoader>();
      loadersByContext.set(context, loadersByArgs);
    }
    let loader = loadersByArgs.get(argsKey);
    if (!loader) {
      loader = createLoader(DataLoaderRef, args, context, info);
      loadersByArgs.set(argsKey, loader);
    }
    return loader;
  };

  return function batchFieldResolver(
    parent: any,
    args: any,
    context: any,
    info: any,
  ) {
    if (dataLoaderRef) {
      return resolveLoader(dataLoaderRef, args, context, info).load(parent);
    }
    return loadDataLoaderPackage().then((DataLoaderRef) =>
      resolveLoader(DataLoaderRef, args, context, info).load(parent),
    );
  };
}

/**
 * Parents queried with different field arguments must not end up in the same
 * batch, as the batch method is handed a single arguments object. `graphql-js`
 * builds the arguments object in schema order, which makes the serialized form
 * stable across the field invocations of a given query.
 */
function createArgsKey(args: any): string | null {
  if (!args || typeof args !== 'object' || Object.keys(args).length === 0) {
    return '';
  }
  try {
    return JSON.stringify(args);
  } catch {
    return null;
  }
}
