import {
  ObjectType,
  InputType,
  InterfaceType,
  ArgsType,
  Field,
  registerEnumType,
  createUnionType,
  TypeMetadataStorage,
} from '../../lib';
import { LazyMetadataStorage } from '../../lib/schema-builder/storages/lazy-metadata.storage';

/**
 * Integration tests for the registerIn decorator option.
 *
 * These tests verify that:
 * 1. The registerIn option is correctly passed through decorators to metadata storage
 * 2. Both direct module references and arrow functions work correctly
 * 3. Arrow functions properly resolve to avoid circular dependency issues
 */

// Mock modules
class AppModule {}
class FeatureModule {}

describe('registerIn decorator option', () => {
  afterEach(() => {
    TypeMetadataStorage.clear();
  });

  describe('@ObjectType decorator', () => {
    it('should store registerIn as arrow function', () => {
      @ObjectType({ registerIn: () => FeatureModule })
      class TestType {
        @Field(() => String)
        name!: string;
      }

      LazyMetadataStorage.load([TestType]);
      TypeMetadataStorage.compile();

      const metadata =
        TypeMetadataStorage.getObjectTypeMetadataByTarget(TestType);
      expect(metadata).toBeDefined();
      expect(metadata!.registerIn).toBeDefined();

      // Arrow function should be stored
      expect(typeof metadata!.registerIn).toBe('function');

      // When called, it should return the module
      const resolvedModule = (metadata!.registerIn as () => Function)();
      expect(resolvedModule).toBe(FeatureModule);
    });

    it('should store registerIn as direct module reference', () => {
      @ObjectType({ registerIn: AppModule })
      class TestType {
        @Field(() => String)
        name!: string;
      }

      LazyMetadataStorage.load([TestType]);
      TypeMetadataStorage.compile();

      const metadata =
        TypeMetadataStorage.getObjectTypeMetadataByTarget(TestType);
      expect(metadata).toBeDefined();
      expect(metadata!.registerIn).toBe(AppModule);
    });

    it('should work without registerIn option (included in all schemas)', () => {
      @ObjectType()
      class TestType {
        @Field(() => String)
        name!: string;
      }

      LazyMetadataStorage.load([TestType]);
      TypeMetadataStorage.compile();

      const metadata =
        TypeMetadataStorage.getObjectTypeMetadataByTarget(TestType);
      expect(metadata).toBeDefined();
      expect(metadata!.registerIn).toBeUndefined();
    });

    it('should work with name and registerIn option', () => {
      @ObjectType('CustomName', { registerIn: () => FeatureModule })
      class TestType {
        @Field(() => String)
        name!: string;
      }

      LazyMetadataStorage.load([TestType]);
      TypeMetadataStorage.compile();

      const metadata =
        TypeMetadataStorage.getObjectTypeMetadataByTarget(TestType);
      expect(metadata).toBeDefined();
      expect(metadata!.name).toBe('CustomName');
      expect((metadata!.registerIn as () => Function)()).toBe(FeatureModule);
    });
  });

  describe('@InputType decorator', () => {
    it('should store registerIn option', () => {
      @InputType({ registerIn: () => FeatureModule })
      class TestInput {
        @Field(() => String)
        name!: string;
      }

      LazyMetadataStorage.load([TestInput]);
      TypeMetadataStorage.compile();

      const metadata =
        TypeMetadataStorage.getInputTypeMetadataByTarget(TestInput);
      expect(metadata).toBeDefined();
      expect((metadata!.registerIn as () => Function)()).toBe(FeatureModule);
    });

    it('should work with name and registerIn option', () => {
      @InputType('CustomInput', { registerIn: () => AppModule })
      class TestInput {
        @Field(() => String)
        value!: string;
      }

      LazyMetadataStorage.load([TestInput]);
      TypeMetadataStorage.compile();

      const metadata =
        TypeMetadataStorage.getInputTypeMetadataByTarget(TestInput);
      expect(metadata).toBeDefined();
      expect(metadata!.name).toBe('CustomInput');
      expect((metadata!.registerIn as () => Function)()).toBe(AppModule);
    });
  });

  describe('@InterfaceType decorator', () => {
    it('should store registerIn option', () => {
      @InterfaceType({ registerIn: () => FeatureModule })
      abstract class TestInterface {
        @Field(() => String)
        id!: string;
      }

      LazyMetadataStorage.load([TestInterface]);
      TypeMetadataStorage.compile();

      const metadata =
        TypeMetadataStorage.getInterfaceMetadataByTarget(TestInterface);
      expect(metadata).toBeDefined();
      expect((metadata!.registerIn as () => Function)()).toBe(FeatureModule);
    });
  });

  describe('@ArgsType decorator', () => {
    it('should store registerIn option', () => {
      @ArgsType({ registerIn: () => AppModule })
      class TestArgs {
        @Field(() => String)
        query!: string;
      }

      LazyMetadataStorage.load([TestArgs]);
      TypeMetadataStorage.compile();

      const metadata =
        TypeMetadataStorage.getArgumentsMetadataByTarget(TestArgs);
      expect(metadata).toBeDefined();
      expect((metadata!.registerIn as () => Function)()).toBe(AppModule);
    });
  });

  describe('registerEnumType function', () => {
    it('should store registerIn option', () => {
      enum TestStatus {
        ACTIVE = 'ACTIVE',
        INACTIVE = 'INACTIVE',
      }

      registerEnumType(TestStatus, {
        name: 'TestStatus',
        registerIn: () => FeatureModule,
      });

      LazyMetadataStorage.load([]);
      TypeMetadataStorage.compile();

      const allEnums = TypeMetadataStorage.getEnumsMetadata();
      const metadata = allEnums.find((e) => e.name === 'TestStatus');

      expect(metadata).toBeDefined();
      expect((metadata!.registerIn as () => Function)()).toBe(FeatureModule);
    });

    it('should work with direct module reference', () => {
      enum DirectRefStatus {
        YES = 'YES',
        NO = 'NO',
      }

      registerEnumType(DirectRefStatus, {
        name: 'DirectRefStatus',
        registerIn: AppModule,
      });

      LazyMetadataStorage.load([]);
      TypeMetadataStorage.compile();

      const allEnums = TypeMetadataStorage.getEnumsMetadata();
      const metadata = allEnums.find((e) => e.name === 'DirectRefStatus');

      expect(metadata).toBeDefined();
      expect(metadata!.registerIn).toBe(AppModule);
    });
  });

  describe('createUnionType function', () => {
    it('should store registerIn option', () => {
      @ObjectType()
      class UnionMemberA {
        @Field(() => String)
        a!: string;
      }

      @ObjectType()
      class UnionMemberB {
        @Field(() => String)
        b!: string;
      }

      LazyMetadataStorage.load([UnionMemberA, UnionMemberB]);

      const TestUnion = createUnionType({
        name: 'TestUnion',
        types: () => [UnionMemberA, UnionMemberB] as const,
        registerIn: () => FeatureModule,
      });

      LazyMetadataStorage.load([]);
      TypeMetadataStorage.compile();

      const allUnions = TypeMetadataStorage.getUnionsMetadata();
      const metadata = allUnions.find((u) => u.name === 'TestUnion');

      expect(metadata).toBeDefined();
      expect((metadata!.registerIn as () => Function)()).toBe(FeatureModule);
    });
  });

  describe('circular dependency handling', () => {
    it('should handle deferred module resolution via arrow function', () => {
      // Simulate circular dependency scenario where module is not yet defined
      let DeferredModule: any;

      @ObjectType({ registerIn: () => DeferredModule })
      class DeferredType {
        @Field(() => String)
        name!: string;
      }

      // Define module after decorator is applied
      DeferredModule = class DeferredModuleClass {};

      LazyMetadataStorage.load([DeferredType]);
      TypeMetadataStorage.compile();

      const metadata =
        TypeMetadataStorage.getObjectTypeMetadataByTarget(DeferredType);
      expect(metadata).toBeDefined();

      // Arrow function should correctly resolve the module
      const resolvedModule = (metadata!.registerIn as () => Function)();
      expect(resolvedModule).toBe(DeferredModule);
    });
  });
});
