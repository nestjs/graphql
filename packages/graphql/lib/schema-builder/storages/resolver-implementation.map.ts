import { Logger } from '@nestjs/common';

import {
  BaseResolverMetadata,
  FieldResolverMetadata,
  ResolverClassMetadata,
  ResolverTypeMetadata,
} from '../metadata/index.js';
import { isThrowing } from '../utils/is-throwing.util.js';

/**
 * Resolves which resolver class implements the handlers declared on a base class.
 *
 * A handler is recorded against the class it is declared on, but Nest instantiates the class
 * registered as a provider. When a resolver extends a base class, every handler declared on that
 * base therefore has to be reassigned to the derived class:
 *
 *   class BaseUserResolver { @Query(() => User) user() {} }    // target: BaseUserResolver
 *   @Resolver() class UserResolver extends BaseUserResolver {} // the class Nest instantiates
 *
 * so `user` has to end up targeting `UserResolver`. Note that the base class need not be a resolver
 * itself - `@Query` records whichever class the method is written on, decorated or not.
 */
export class ResolverImplementationMap {
  private readonly resolverByBaseClass = new Map<
    Function,
    ResolverClassMetadata
  >();
  private readonly logger = new Logger(ResolverImplementationMap.name);

  /**
   * @param resolvers every registered resolver class, in registration order.
   * @param handlerGroups the handler arrays, kept as groups rather than a flattened set so they are
   * only scanned when an ambiguity actually has to be reported.
   */
  constructor(
    resolvers: readonly ResolverClassMetadata[],
    private readonly handlerGroups: readonly BaseResolverMetadata[][],
  ) {
    this.collectExtendedResolversMap(resolvers);
  }

  /** True when no resolver extends anything, so there is nothing to reassign. */
  get isEmpty() {
    return this.resolverByBaseClass.size === 0;
  }

  /**
   * The resolver that ends up serving handlers declared on `baseClass`, following the full chain.
   * `resolverByBaseClass` is keyed by base class and holds the resolver extending it, so a lookup
   * steps one level *down* the chain. Keep stepping until nothing extends the class just landed on.
   * Adding `class AdminUserResolver extends UserResolver` to the example above:
   *
   *   BaseUserResolver -> UserResolver -> AdminUserResolver
   *
   * and `AdminUserResolver` serves it. Intermediate classes are stepped through, not selected.
   */
  getResolverImplementationForBaseClass(baseClass: Function) {
    let resolver = this.resolverByBaseClass.get(baseClass);
    while (resolver && this.resolverByBaseClass.has(resolver.target)) {
      resolver = this.resolverByBaseClass.get(resolver.target);
    }
    return resolver;
  }

  /** Rewrites every metadata entry to target the resolver class that implements it, if any. */
  collectAllMetadata(baseMetadatas: ResolverTypeMetadata[]) {
    return baseMetadatas.map((baseMetadata) =>
      this.getImplementationMetadataForBaseClass(baseMetadata),
    );
  }

  /**
   * Rewrites every field resolver metadata entry to target the resolver class that implements it,
   * if any. A field resolver whose own `objectTypeFn` cannot resolve its host type falls back to
   * the `typeFn` of the resolver that now owns it.
   */
  collectFieldResolversMetadata(fieldResolvers: FieldResolverMetadata[]) {
    return fieldResolvers.map((metadata) => {
      const classMetadata = this.getResolverImplementationForBaseClass(
        metadata.target,
      );
      if (!classMetadata) {
        return metadata;
      }
      return {
        ...metadata,
        target: classMetadata.target,
        classMetadata,
        objectTypeFn: isThrowing(metadata.objectTypeFn)
          ? classMetadata.typeFn
          : metadata.objectTypeFn,
      };
    });
  }

  /** The same handler, reattributed to the resolver class that implements it. */
  private getImplementationMetadataForBaseClass(
    baseClassMetadata: ResolverTypeMetadata,
  ): ResolverTypeMetadata {
    const classMetadata = this.getResolverImplementationForBaseClass(
      baseClassMetadata.target,
    );

    return classMetadata
      ? { ...baseClassMetadata, target: classMetadata.target, classMetadata }
      : baseClassMetadata;
  }

  /** Maps every base class to the resolver that inherits its handlers. First registration wins. */
  private collectExtendedResolversMap(
    resolvers: readonly ResolverClassMetadata[],
  ) {
    for (const resolver of resolvers) {
      let baseClass = Object.getPrototypeOf(resolver.target);

      while (baseClass.prototype) {
        const claimedBy = this.resolverByBaseClass.get(baseClass);
        if (claimedBy) {
          this.warnOnAmbiguousBaseClass(baseClass, claimedBy, resolver);
        } else {
          this.resolverByBaseClass.set(baseClass, resolver);
        }
        baseClass = Object.getPrototypeOf(baseClass);
      }
    }
  }

  /**
   * Reached only when a base class is claimed twice. When both resolvers sit on one inheritance
   * chain that is expected, and following the chain attributes the handlers correctly. When they
   * sit on different branches only one can inherit the base, so the other silently misses out -
   * worth reporting, but only if the base declares anything to miss out on.
   */
  private warnOnAmbiguousBaseClass(
    baseClass: Function,
    claimedBy: ResolverClassMetadata,
    resolver: ResolverClassMetadata,
  ) {
    if (
      this.sharesInheritanceChain(claimedBy.target, resolver.target) ||
      !this.declaresHandler(baseClass)
    ) {
      return;
    }

    this.logger.warn(
      `${baseClass.name} is extended by both ${claimedBy.target.name} and ` +
        `${resolver.target.name}, but its handlers can only be served by one class. They will be ` +
        `resolved by ${claimedBy.target.name} because it was registered first, so ` +
        `${resolver.target.name} will never serve them, and reordering imports can silently swap ` +
        `which class wins. Detecting this also adds work to every schema build; declare these ` +
        `handlers on a base class that only one resolver extends.`,
    );
  }

  /** True when the class declares at least one handler, i.e. there is something to miss out on. */
  private declaresHandler(target: Function) {
    return this.handlerGroups.some((handlers) =>
      handlers.some((handler) => handler.target === target),
    );
  }

  /** True when either class derives from the other, i.e. they sit on a single inheritance chain. */
  private sharesInheritanceChain(a: Function, b: Function) {
    return this.isDerivedFrom(a, b) || this.isDerivedFrom(b, a);
  }

  private isDerivedFrom(derived: Function, base: Function) {
    let current = Object.getPrototypeOf(derived);
    while (current?.prototype) {
      if (current === base) {
        return true;
      }
      current = Object.getPrototypeOf(current);
    }
    return false;
  }
}
