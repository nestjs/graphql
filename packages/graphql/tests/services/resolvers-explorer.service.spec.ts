import 'reflect-metadata';
import { MetadataScanner } from '@nestjs/core';
import {
  ObjectType,
  ResolveField,
  Resolver,
  Subscription as SubscriptionHandler,
} from '../../lib/decorators/index.js';
import {
  FIELD_RESOLVER_MIDDLEWARE_METADATA,
  PARAM_ARGS_METADATA,
} from '../../lib/graphql.constants.js';
import { ResolverDecoratorHost } from '../../lib/services/resolver-decorator-host.js';
import { ResolversExplorerService } from '../../lib/services/resolvers-explorer.service.js';

describe('ResolversExplorerService', () => {
  describe('canUseFastFieldResolver', () => {
    let service: ResolversExplorerService;
    let mockInstance: any;

    beforeEach(() => {
      // Create a minimal mock of the service to test private method
      service = Object.create(ResolversExplorerService.prototype);
      (service as any).gqlOptions = {};
      // Reset caches for each test
      (service as any).hasGlobalFieldMiddleware = null;
      (service as any).fieldResolverEnhancersLookup = null;

      mockInstance = {
        constructor: class TestResolver {},
        testMethod: vi.fn(),
      };
    });

    // Helper to access private method
    const canUseFastFieldResolver = (
      instance: object,
      methodKey: string,
      contextOptions?: {
        guards: boolean;
        filters: boolean;
        interceptors: boolean;
      },
    ): boolean => {
      return (service as any).canUseFastFieldResolver(
        instance,
        methodKey,
        contextOptions,
      );
    };

    describe('when all conditions are met for fast-path', () => {
      it('should return true when no enhancers, no middleware, no param decorators', () => {
        const result = canUseFastFieldResolver(mockInstance, 'testMethod', {
          guards: false,
          filters: false,
          interceptors: false,
        });
        expect(result).toBe(true);
      });

      it('should return true when contextOptions is undefined', () => {
        const result = canUseFastFieldResolver(
          mockInstance,
          'testMethod',
          undefined,
        );
        expect(result).toBe(true);
      });
    });

    describe('when guards are enabled', () => {
      it('should return false', () => {
        const result = canUseFastFieldResolver(mockInstance, 'testMethod', {
          guards: true,
          filters: false,
          interceptors: false,
        });
        expect(result).toBe(false);
      });
    });

    describe('when filters are enabled', () => {
      it('should return false', () => {
        const result = canUseFastFieldResolver(mockInstance, 'testMethod', {
          guards: false,
          filters: true,
          interceptors: false,
        });
        expect(result).toBe(false);
      });
    });

    describe('when interceptors are enabled', () => {
      it('should return false', () => {
        const result = canUseFastFieldResolver(mockInstance, 'testMethod', {
          guards: false,
          filters: false,
          interceptors: true,
        });
        expect(result).toBe(false);
      });
    });

    describe('when method-level field middleware exists', () => {
      it('should return false', () => {
        Reflect.defineMetadata(
          FIELD_RESOLVER_MIDDLEWARE_METADATA,
          [() => {}],
          mockInstance.testMethod,
        );

        const result = canUseFastFieldResolver(mockInstance, 'testMethod', {
          guards: false,
          filters: false,
          interceptors: false,
        });
        expect(result).toBe(false);
      });

      afterEach(() => {
        Reflect.deleteMetadata(
          FIELD_RESOLVER_MIDDLEWARE_METADATA,
          mockInstance.testMethod,
        );
      });
    });

    describe('when global field middleware exists', () => {
      it('should return false', () => {
        (service as any).gqlOptions = {
          buildSchemaOptions: {
            fieldMiddleware: [() => {}],
          },
        };

        const result = canUseFastFieldResolver(mockInstance, 'testMethod', {
          guards: false,
          filters: false,
          interceptors: false,
        });
        expect(result).toBe(false);
      });
    });

    describe('when parameter decorators are used', () => {
      it('should return false when @Parent is used', () => {
        Reflect.defineMetadata(
          PARAM_ARGS_METADATA,
          { '0:root': { index: 0, data: undefined } },
          mockInstance.constructor,
          'testMethod',
        );

        const result = canUseFastFieldResolver(mockInstance, 'testMethod', {
          guards: false,
          filters: false,
          interceptors: false,
        });
        expect(result).toBe(false);
      });

      it('should return false when @Args is used', () => {
        Reflect.defineMetadata(
          PARAM_ARGS_METADATA,
          { '1:args': { index: 0, data: 'id' } },
          mockInstance.constructor,
          'testMethod',
        );

        const result = canUseFastFieldResolver(mockInstance, 'testMethod', {
          guards: false,
          filters: false,
          interceptors: false,
        });
        expect(result).toBe(false);
      });

      afterEach(() => {
        Reflect.deleteMetadata(
          PARAM_ARGS_METADATA,
          mockInstance.constructor,
          'testMethod',
        );
      });
    });

    describe('when empty param metadata exists', () => {
      it('should return true', () => {
        Reflect.defineMetadata(
          PARAM_ARGS_METADATA,
          {},
          mockInstance.constructor,
          'testMethod',
        );

        const result = canUseFastFieldResolver(mockInstance, 'testMethod', {
          guards: false,
          filters: false,
          interceptors: false,
        });
        expect(result).toBe(true);
      });

      afterEach(() => {
        Reflect.deleteMetadata(
          PARAM_ARGS_METADATA,
          mockInstance.constructor,
          'testMethod',
        );
      });
    });
  });

  describe('fast-path field resolver behavior', () => {
    it('should correctly bind this context when using fast-path', () => {
      const mockService = { getData: vi.fn().mockReturnValue('test-data') };

      class TestResolver {
        private service = mockService;

        getField() {
          return this.service.getData();
        }
      }

      const instance = new TestResolver();
      const resolverFn = instance.getField.bind(instance);

      // Simulate what graphql-js passes
      const result = resolverFn(
        { id: '1' },
        {},
        { user: {} },
        { fieldName: 'getField' },
      );

      expect(result).toBe('test-data');
      expect(mockService.getData).toHaveBeenCalled();
    });

    it('should correctly handle async resolvers in fast-path', async () => {
      class TestResolver {
        async getAsyncField() {
          return Promise.resolve('async-data');
        }
      }

      const instance = new TestResolver();
      const resolverFn = instance.getAsyncField.bind(instance);

      const result = resolverFn({}, {}, {}, {});

      expect(result).toBeInstanceOf(Promise);
      expect(await result).toBe('async-data');
    });

    it('should propagate errors correctly in fast-path', () => {
      class TestResolver {
        getErrorField() {
          throw new Error('Test error');
        }
      }

      const instance = new TestResolver();
      const resolverFn = instance.getErrorField.bind(instance);

      expect(() => resolverFn({}, {}, {}, {})).toThrow('Test error');
    });

    it('should receive all four graphql arguments', () => {
      const receivedArgs: any[] = [];

      class TestResolver {
        getField(...args: any[]) {
          receivedArgs.push(...args);
          return 'result';
        }
      }

      const instance = new TestResolver();
      const resolverFn = instance.getField.bind(instance);

      const parent = { id: '1' };
      const args = { limit: 10 };
      const context = { user: { id: 'user1' } };
      const info = { fieldName: 'getField' };

      resolverFn(parent, args, context, info);

      expect(receivedArgs).toEqual([parent, args, context, info]);
    });
  });

  describe('filterResolvers', () => {
    const createService = (gqlOptions: Record<string, any> = {}) => {
      const externalContextCreator = {
        create: vi.fn(
          (instance: any, callback: Function) =>
            (...args: unknown[]) =>
              callback.apply(instance, args),
        ),
      };
      const service = new ResolversExplorerService(
        undefined,
        new MetadataScanner(),
        externalContextCreator as any,
        gqlOptions,
        undefined,
        { insertEntrypoint: () => {} } as any,
        new ResolverDecoratorHost(),
      );
      return { service, externalContextCreator };
    };
    const gqlAdapter = {
      subscriptionWithFilter: vi.fn(
        (_instanceRef: unknown, _filter: Function, createContext: Function) =>
          createContext(),
      ),
    };
    const filterResolvers = (
      service: ResolversExplorerService,
      instance: object,
      isDependencyTreeStatic = true,
    ) => {
      const wrapper = {
        instance,
        id: 'id',
        name: instance.constructor.name,
        metatype: instance.constructor,
        isAlias: false,
        isDependencyTreeStatic: () => isDependencyTreeStatic,
        getEnhancersMetadata: () => [],
      };
      const moduleRef = {
        name: 'TestModule',
        injectables: new Map(),
        entryProviders: [wrapper],
        providers: new Map(),
        assignControllerUniqueId: () => {},
      };
      return service.filterResolvers(
        gqlAdapter as any,
        wrapper as any,
        moduleRef as any,
      );
    };

    describe('of a code first object type named like a root type', () => {
      @ObjectType()
      class Subscription {}

      @Resolver(() => Subscription)
      class SubscriptionResolver {
        @ResolveField(() => String)
        cardNumber() {
          return '**** 1111';
        }

        helper() {}
      }

      @ObjectType()
      class Mutation {}

      @Resolver(() => Mutation)
      class MutationResolver {
        @ResolveField(() => String)
        patientName() {
          return 'J. D.';
        }
      }

      it('should bind a field resolver of a type named "Subscription" as a field resolver', async () => {
        const { service } = createService({
          fieldResolverEnhancers: ['guards'],
        });

        const resolvers = filterResolvers(service, new SubscriptionResolver());

        expect(resolvers).toHaveLength(1);
        expect(resolvers[0]).toMatchObject({
          type: 'Subscription',
          name: 'cardNumber',
        });
        expect(typeof resolvers[0].callback).toBe('function');
        expect(await (resolvers[0].callback as Function)({}, {}, {}, {})).toBe(
          '**** 1111',
        );
      });

      it('should keep all the enhancers on for a field resolver of a type named "Mutation"', () => {
        const { service, externalContextCreator } = createService();

        filterResolvers(service, new MutationResolver());

        expect(externalContextCreator.create).toHaveBeenCalledWith(
          expect.anything(),
          MutationResolver.prototype.patientName,
          'patientName',
          expect.anything(),
          expect.anything(),
          undefined,
          undefined,
          { guards: true, filters: true, interceptors: true },
          'graphql',
        );
      });

      it('should apply field middleware to a field resolver of a type named "Mutation"', async () => {
        const { service } = createService({
          buildSchemaOptions: {
            fieldMiddleware: [async () => 'masked'],
          },
        });

        const [resolver] = filterResolvers(service, new MutationResolver());

        expect(await (resolver.callback as Function)({}, {}, {}, {})).toBe(
          'masked',
        );
      });
    });

    describe('of a schema first "Subscription" resolver', () => {
      @Resolver('Subscription')
      class CommentsResolver {
        @ResolveField()
        commentAdded() {
          return 'iterator';
        }
      }

      it('should still bind its handlers as subscriptions', () => {
        const { service } = createService();

        const [resolver] = filterResolvers(service, new CommentsResolver());

        expect(resolver.callback).toEqual({
          resolve: undefined,
          subscribe: expect.any(Function),
        });
      });
    });

    describe('of a resolver rebinding its methods', () => {
      @Resolver()
      class NotificationsResolver {
        constructor() {
          this.notifications = this.notifications.bind(this);
          this.unread = this.unread.bind(this);
          this.total = this.total.bind(this);
        }

        @SubscriptionHandler(() => String, { filter: () => true })
        notifications() {
          return 'iterator';
        }

        @ResolveField(() => Number, { middleware: [async () => 42] })
        @Resolver('Inbox')
        unread() {
          return 0;
        }

        @ResolveField(() => Number)
        @Resolver('Inbox')
        total() {
          return 0;
        }
      }

      it('should read the options of "@Subscription()" from the decorated method', () => {
        const { service } = createService();
        gqlAdapter.subscriptionWithFilter.mockClear();

        filterResolvers(service, new NotificationsResolver());

        expect(gqlAdapter.subscriptionWithFilter).toHaveBeenCalledTimes(1);
      });

      it('should read the field middleware from the decorated method', async () => {
        const { service } = createService();

        const resolvers = filterResolvers(service, new NotificationsResolver());
        const unread = resolvers.find(({ name }) => name === 'unread');

        expect(await (unread.callback as Function)({}, {}, {}, {})).toBe(42);
      });

      it('should create the context of a request-scoped resolver from the decorated method', async () => {
        const { service, externalContextCreator } = createService();
        const instance = new NotificationsResolver();
        (service as any).coreModuleRef = null;
        (service as any).injector = { loadPerContext: async () => instance };

        const resolvers = filterResolvers(service, instance, false);
        const total = resolvers.find(({ name }) => name === 'total');
        await (total.callback as Function)({}, {}, {}, {});

        expect(externalContextCreator.create).toHaveBeenCalledWith(
          instance,
          NotificationsResolver.prototype.total,
          'total',
          expect.anything(),
          expect.anything(),
          expect.anything(),
          'id',
          expect.anything(),
          'graphql',
        );
      });
    });
  });

  describe('createSubscriptionMetadata', () => {
    const service: ResolversExplorerService = Object.create(
      ResolversExplorerService.prototype,
    );
    const instance = { tag: 'instance' };
    const info = { operation: {} } as any;

    const createCallback = (subscribe: Function, filter?: Function) =>
      service.createSubscriptionMetadata(
        {
          subscriptionWithFilter: (
            _instanceRef: unknown,
            _filterFn: Function,
            createSubscribeContext: Function,
          ) => createSubscribeContext(),
        } as any,
        () => subscribe,
        {
          filter: filter as any,
          resolve(this: typeof instance, payload: any) {
            return `${this.tag}:${payload}`;
          },
        },
        { name: 'changed', methodName: 'changed' } as any,
        instance,
      ).callback;

    it('should resolve the events of an operation whose "subscribe" succeeded', async () => {
      const callback = createCallback(() => 'eventStream');
      const context = {};

      expect(await callback.subscribe(undefined, {}, context, info)).toBe(
        'eventStream',
      );
      expect(callback.resolve('event', {}, context, info)).toBe(
        'instance:event',
      );
    });

    it('should resolve the events of a filtered subscription', async () => {
      const callback = createCallback(
        () => 'eventStream',
        () => true,
      );
      const context = {};

      await callback.subscribe(undefined, {}, context, info);
      expect(callback.resolve('event', {}, context, info)).toBe(
        'instance:event',
      );
    });

    it('should not resolve an operation that did not run "subscribe" (e.g., sent over HTTP)', () => {
      const callback = createCallback(() => 'eventStream');

      expect(() => callback.resolve(undefined, {}, {}, info)).toThrow(
        '"changed" can only be resolved for the events of an active subscription.',
      );
    });

    it('should not resolve an operation whose "subscribe" failed', async () => {
      const callback = createCallback(() => {
        throw new Error('Forbidden resource');
      });
      const context = {};

      await expect(
        callback.subscribe(undefined, {}, context, info),
      ).rejects.toThrow('Forbidden resource');
      expect(() => callback.resolve(undefined, {}, context, info)).toThrow(
        '"changed" can only be resolved for the events of an active subscription.',
      );
    });
  });
});
