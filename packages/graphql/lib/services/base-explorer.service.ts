import { ContextIdFactory } from '@nestjs/core';
import {
  ContextId,
  InstanceWrapper,
} from '@nestjs/core/injector/instance-wrapper.js';
import { Module } from '@nestjs/core/injector/module.js';
import { REQUEST_CONTEXT_ID } from '@nestjs/core/router/request/request-constants.js';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface.js';

/**
 * A handler found by an explorer, along with the classes `groupMetadata()`
 * needs to tell which of two handlers of the same field takes precedence.
 */
export interface ExploredResolverMetadata extends ResolverMetadata {
  /** The class of the instance the handler was found on. */
  target?: Function;
  /** The class whose prototype declares the handler method. */
  declaredOn?: Function;
}

export class BaseExplorerService {
  /**
   * @param skipGlobalImports whether to leave out the global modules that the
   * included modules (or their imports) only see because they are global:
   * Nest adds every global module to the imports of every other module.
   */
  getModules(
    modulesContainer: Map<string, Module> | undefined,
    include: Function[],
    skipGlobalImports = false,
  ): Module[] {
    if (!modulesContainer) {
      return [];
    }
    if (!include || include.length === 0) {
      return [...modulesContainer.values()];
    }
    const explicitlyWhitelisted = this.includeWhitelisted(
      modulesContainer,
      include,
    );
    const modulesToInclude = [];
    const toCheck = [...explicitlyWhitelisted];
    while (toCheck.length) {
      const moduleRef = toCheck.pop();
      if (!modulesToInclude.includes(moduleRef)) {
        modulesToInclude.push(moduleRef);
        for (const importedModuleRef of moduleRef.imports) {
          if (!(skipGlobalImports && importedModuleRef.isGlobal)) {
            toCheck.push(importedModuleRef);
          }
        }
      }
    }

    return modulesToInclude;
  }

  includeWhitelisted(
    modulesContainer: Map<string, Module>,
    include: Function[],
  ): Module[] {
    const modules = [...modulesContainer.values()];
    return modules.filter(({ metatype }) =>
      include.some((item) => item === metatype),
    );
  }

  flatMap<T = ResolverMetadata>(
    modules: Module[],
    callback: (instance: InstanceWrapper, moduleRef: Module) => T | T[],
  ): T[] {
    return modules.reduce<T[]>((collected, moduleRef) => {
      const providers = [...moduleRef.providers.values()];
      for (const wrapper of providers) {
        const result = callback(wrapper, moduleRef);
        if (Array.isArray(result)) {
          collected.push(...result.filter(Boolean));
        } else if (result) {
          collected.push(result);
        }
      }
      return collected;
    }, []);
  }

  /**
   * Groups the handlers by type and field name. When two handlers are found
   * for one field, the one declared on the most derived class wins (then the
   * one found on the most derived class), whatever the order the modules are
   * scanned in, so that a subclass overriding a handler (e.g., to guard it)
   * is not replaced by the base resolver it extends. Two handlers of classes
   * that do not extend one another are refused: the order the modules are
   * scanned in would decide which one runs.
   */
  groupMetadata(resolvers: ExploredResolverMetadata[]) {
    const registered = new Map<string, ExploredResolverMetadata>();
    return resolvers.reduce<
      Record<string, Record<string, ResolverMetadata['callback']>>
    >((grouped, metadata) => {
      const key = `${metadata.type}.${metadata.name}`;
      const previous = registered.get(key);
      grouped[metadata.type] ??= {};
      if (previous && this.keepsPrecedence(previous, metadata)) {
        return grouped;
      }
      grouped[metadata.type][metadata.name] = metadata.callback;
      registered.set(key, metadata);
      return grouped;
    }, {});
  }

  /**
   * Returns the context id of the request a GraphQL context belongs to (the
   * one Nest middleware assigned to it, if any) and pins it on the context.
   */
  getContextId(gqlContext: Record<string | symbol, any>): ContextId {
    // Nest middleware tags the request it is handed: on Fastify, that is the
    // raw Node request, which "getByRequest()" does not reach through "req"
    const contextId: ContextId =
      gqlContext?.req?.raw?.[REQUEST_CONTEXT_ID] ??
      ContextIdFactory.getByRequest(gqlContext, ['req']);
    if (!gqlContext[REQUEST_CONTEXT_ID as any]) {
      Object.defineProperty(gqlContext, REQUEST_CONTEXT_ID, {
        value: contextId,
        enumerable: false,
        configurable: false,
        writable: false,
      });
    }
    return contextId;
  }

  /**
   * Whether the handler registered first for a field is kept over the one
   * found after it. Handlers without class information keep the "last one
   * wins" behaviour.
   * @throws when neither handler takes precedence over the other.
   */
  private keepsPrecedence(
    registered: ExploredResolverMetadata,
    incoming: ExploredResolverMetadata,
  ): boolean {
    const { declaredOn: registeredOwner, target: registeredHost } = registered;
    const { declaredOn: incomingOwner, target: incomingHost } = incoming;
    if (
      !registeredOwner ||
      !incomingOwner ||
      !registeredHost ||
      !incomingHost
    ) {
      return false;
    }
    if (this.isDerivedFrom(registeredOwner, incomingOwner)) {
      return true;
    }
    if (this.isDerivedFrom(incomingOwner, registeredOwner)) {
      return false;
    }
    if (this.isDerivedFrom(registeredHost, incomingHost)) {
      return true;
    }
    if (this.isDerivedFrom(incomingHost, registeredHost)) {
      return false;
    }
    if (
      registeredOwner === incomingOwner &&
      registered.methodName === incoming.methodName
    ) {
      // Either the same handler found twice (on two instances of a class, or
      // through an alias), which keeps the "last one wins" behaviour, or the
      // same method inherited by two sibling resolvers: the schema attributes
      // it to the one registered first, so keep that one
      return registeredHost !== incomingHost;
    }
    throw new Error(
      `"${incoming.type}.${incoming.name}" is resolved by both ` +
        `"${registeredHost.name}.${registered.methodName}" and ` +
        `"${incomingHost.name}.${incoming.methodName}", which do not override ` +
        `one another, so the order in which the modules are scanned would ` +
        `decide which one runs. Declare the field once, or have one resolver ` +
        `extend the other and override the method.`,
    );
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
