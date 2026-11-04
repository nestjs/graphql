import { ContextIdFactory } from '@nestjs/core';
import { REQUEST_CONTEXT_ID } from '@nestjs/core/router/request/request-constants.js';
import {
  BaseExplorerService,
  ExploredResolverMetadata,
} from '../../lib/services/base-explorer.service.js';

describe('BaseExplorerService', () => {
  const service = new BaseExplorerService();

  describe('groupMetadata', () => {
    class BaseResolver {
      account() {}
      findAll() {}
    }
    class GuardedResolver extends BaseResolver {
      override account() {}
      findAllForStaff() {}
    }
    class SiblingResolver extends BaseResolver {}
    class UnrelatedResolver {
      account() {}
    }

    const handler = (
      target: Function,
      declaredOn: Function,
      methodName = 'account',
      name = 'account',
    ): ExploredResolverMetadata => ({
      type: 'Query',
      name,
      methodName,
      target,
      declaredOn,
      callback: { target, declaredOn, methodName },
    });

    it('should keep the handler of the subclass, whatever the scan order', () => {
      const derived = handler(GuardedResolver, GuardedResolver);
      const base = handler(BaseResolver, BaseResolver);

      expect(service.groupMetadata([derived, base]).Query.account).toBe(
        derived.callback,
      );
      expect(service.groupMetadata([base, derived]).Query.account).toBe(
        derived.callback,
      );
    });

    it('should keep the handler of the subclass when it only inherits the method', () => {
      // e.g., a subclass that only adds a class-level guard
      const derived = handler(SiblingResolver, BaseResolver);
      const base = handler(BaseResolver, BaseResolver);

      expect(service.groupMetadata([derived, base]).Query.account).toBe(
        derived.callback,
      );
      expect(service.groupMetadata([base, derived]).Query.account).toBe(
        derived.callback,
      );
    });

    it('should keep a renamed redeclaration over the inherited method of one provider', () => {
      const own = handler(
        GuardedResolver,
        GuardedResolver,
        'findAllForStaff',
        'findAllInvoice',
      );
      const inherited = handler(
        GuardedResolver,
        BaseResolver,
        'findAll',
        'findAllInvoice',
      );

      expect(service.groupMetadata([own, inherited]).Query.findAllInvoice).toBe(
        own.callback,
      );
      expect(service.groupMetadata([inherited, own]).Query.findAllInvoice).toBe(
        own.callback,
      );
    });

    it('should keep the first of two siblings inheriting the same method', () => {
      const first = handler(GuardedResolver, BaseResolver, 'findAll', 'all');
      const second = handler(SiblingResolver, BaseResolver, 'findAll', 'all');

      expect(service.groupMetadata([first, second]).Query.all).toBe(
        first.callback,
      );
    });

    it('should keep the last handler found for the same method of one class', () => {
      // e.g., the same class provided by two modules
      const first = handler(UnrelatedResolver, UnrelatedResolver);
      const second = handler(UnrelatedResolver, UnrelatedResolver);

      expect(service.groupMetadata([first, second]).Query.account).toBe(
        second.callback,
      );
    });

    it('should refuse handlers of the same field on classes that do not extend one another', () => {
      const first = handler(UnrelatedResolver, UnrelatedResolver);
      const second = handler(GuardedResolver, GuardedResolver);

      expect(() => service.groupMetadata([first, second])).toThrow(
        '"Query.account" is resolved by both "UnrelatedResolver.account" and "GuardedResolver.account", which do not override one another',
      );
    });

    it('should refuse two methods of one class resolving the same field', () => {
      const first = handler(GuardedResolver, GuardedResolver, 'account', 'x');
      const second = handler(
        GuardedResolver,
        GuardedResolver,
        'findAllForStaff',
        'x',
      );

      expect(() => service.groupMetadata([first, second])).toThrow(
        '"Query.x" is resolved by both',
      );
    });

    it('should keep the last handler when the classes are unknown', () => {
      const first = { type: 'Query', name: 'a', methodName: 'a', callback: 1 };
      const second = { type: 'Query', name: 'a', methodName: 'a', callback: 2 };

      expect(service.groupMetadata([first, second]).Query.a).toBe(2);
    });
  });

  describe('getModules', () => {
    const createModule = (metatype: Function, isGlobal = false) =>
      ({ metatype, isGlobal, imports: new Set() } as any);

    class CatalogModule {}
    class AuditModule {}
    class SharedModule {}

    it('should leave out the global modules an included module sees, when asked to', () => {
      const catalog = createModule(CatalogModule);
      const audit = createModule(AuditModule, true);
      const shared = createModule(SharedModule);
      // Nest adds every global module to the imports of every other module
      catalog.imports.add(shared).add(audit);
      shared.imports.add(audit);
      const container = new Map([
        ['catalog', catalog],
        ['audit', audit],
        ['shared', shared],
      ]);

      expect(service.getModules(container, [CatalogModule], true)).toEqual([
        catalog,
        shared,
      ]);
      expect(
        service.getModules(container, [CatalogModule, AuditModule], true),
      ).toEqual(expect.arrayContaining([catalog, shared, audit]));
      expect(service.getModules(container, [CatalogModule])).toEqual(
        expect.arrayContaining([catalog, shared, audit]),
      );
    });
  });

  describe('getContextId', () => {
    it('should find the context id Nest middleware assigned to the raw request (Fastify)', () => {
      const contextId = ContextIdFactory.create();
      const gqlContext = { req: { raw: { [REQUEST_CONTEXT_ID]: contextId } } };

      expect(service.getContextId(gqlContext)).toBe(contextId);
      expect(gqlContext[REQUEST_CONTEXT_ID]).toBe(contextId);
    });

    it('should find the context id assigned to the request (Express)', () => {
      const contextId = ContextIdFactory.create();
      const gqlContext = { req: { [REQUEST_CONTEXT_ID]: contextId } };

      expect(service.getContextId(gqlContext)).toBe(contextId);
    });

    it('should create a context id and keep it on the GraphQL context', () => {
      const gqlContext = { req: { raw: {} } };

      const contextId = service.getContextId(gqlContext);
      expect(contextId).toBeDefined();
      expect(service.getContextId(gqlContext)).toBe(contextId);
    });
  });
});
