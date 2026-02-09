import 'reflect-metadata';
import {
  FIELD_RESOLVER_MIDDLEWARE_METADATA,
  PARAM_ARGS_METADATA,
} from '../../lib/graphql.constants';
import { ResolversExplorerService } from '../../lib/services/resolvers-explorer.service';

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
        testMethod: jest.fn(),
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
      const mockService = { getData: jest.fn().mockReturnValue('test-data') };

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
});
