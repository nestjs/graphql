import {
  ObjectType,
  InputType,
  InterfaceType,
  ArgsType,
  Field,
  registerEnumType,
  createUnionType,
  TypeMetadataStorage,
} from '../../../lib';
import { LazyMetadataStorage } from '../../../lib/schema-builder/storages/lazy-metadata.storage';

// Mock modules for testing
class ModuleA {}
class ModuleB {}
class ModuleC {}

// Test types for ObjectType
@ObjectType({ registerIn: () => ModuleA })
class ObjectTypeInModuleA {
  @Field(() => String)
  name!: string;
}

@ObjectType({ registerIn: () => ModuleB })
class ObjectTypeInModuleB {
  @Field(() => String)
  name!: string;
}

@ObjectType({ registerIn: ModuleA }) // Direct reference (not arrow function)
class ObjectTypeInModuleADirect {
  @Field(() => String)
  name!: string;
}

@ObjectType() // No registerIn - should be included everywhere
class ObjectTypeGlobal {
  @Field(() => String)
  name!: string;
}

// Test types for InputType
@InputType({ registerIn: () => ModuleA })
class InputTypeInModuleA {
  @Field(() => String)
  name!: string;
}

@InputType({ registerIn: () => ModuleB })
class InputTypeInModuleB {
  @Field(() => String)
  name!: string;
}

@InputType() // No registerIn
class InputTypeGlobal {
  @Field(() => String)
  name!: string;
}

// Test types for InterfaceType
@InterfaceType({ registerIn: () => ModuleA })
abstract class InterfaceTypeInModuleA {
  @Field(() => String)
  name!: string;
}

@InterfaceType({ registerIn: () => ModuleB })
abstract class InterfaceTypeInModuleB {
  @Field(() => String)
  name!: string;
}

@InterfaceType() // No registerIn
abstract class InterfaceTypeGlobal {
  @Field(() => String)
  name!: string;
}

// Test types for ArgsType
@ArgsType({ registerIn: () => ModuleA })
class ArgsTypeInModuleA {
  @Field(() => String)
  name!: string;
}

@ArgsType({ registerIn: () => ModuleB })
class ArgsTypeInModuleB {
  @Field(() => String)
  name!: string;
}

@ArgsType() // No registerIn
class ArgsTypeGlobal {
  @Field(() => String)
  name!: string;
}

// Test enums
enum StatusEnumA {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

enum StatusEnumB {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

enum StatusEnumGlobal {
  YES = 'YES',
  NO = 'NO',
}

registerEnumType(StatusEnumA, {
  name: 'StatusEnumA',
  registerIn: () => ModuleA,
});

registerEnumType(StatusEnumB, {
  name: 'StatusEnumB',
  registerIn: () => ModuleB,
});

registerEnumType(StatusEnumGlobal, {
  name: 'StatusEnumGlobal',
});

// Test unions - created after loading metadata to ensure ObjectTypes are registered
let UnionInModuleA: any;
let UnionInModuleB: any;
let UnionGlobal: any;

describe('TypeMetadataStorage registerIn filtering', () => {
  beforeAll(() => {
    // Load all decorated class metadata
    LazyMetadataStorage.load([
      ObjectTypeInModuleA,
      ObjectTypeInModuleB,
      ObjectTypeInModuleADirect,
      ObjectTypeGlobal,
      InputTypeInModuleA,
      InputTypeInModuleB,
      InputTypeGlobal,
      InterfaceTypeInModuleA,
      InterfaceTypeInModuleB,
      InterfaceTypeGlobal,
      ArgsTypeInModuleA,
      ArgsTypeInModuleB,
      ArgsTypeGlobal,
    ]);

    // Create unions after ObjectTypes are registered
    UnionInModuleA = createUnionType({
      name: 'UnionInModuleA',
      types: () => [ObjectTypeInModuleA, ObjectTypeGlobal] as const,
      registerIn: () => ModuleA,
    });

    UnionInModuleB = createUnionType({
      name: 'UnionInModuleB',
      types: () => [ObjectTypeInModuleB, ObjectTypeGlobal] as const,
      registerIn: () => ModuleB,
    });

    UnionGlobal = createUnionType({
      name: 'UnionGlobal',
      types: () => [ObjectTypeGlobal] as const,
    });

    // Load enum and union metadata
    LazyMetadataStorage.load([]);

    TypeMetadataStorage.compile();
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  describe('getObjectTypesMetadataByModules', () => {
    it('should return types registered in specified module', () => {
      const result = TypeMetadataStorage.getObjectTypesMetadataByModules([
        ModuleA,
      ]);

      const targets = result.map((m) => m.target);
      expect(targets).toContain(ObjectTypeInModuleA);
      expect(targets).toContain(ObjectTypeInModuleADirect);
      expect(targets).not.toContain(ObjectTypeInModuleB);
    });

    it('should include types with no registerIn (global types)', () => {
      const result = TypeMetadataStorage.getObjectTypesMetadataByModules([
        ModuleA,
      ]);

      const targets = result.map((m) => m.target);
      expect(targets).toContain(ObjectTypeGlobal);
    });

    it('should handle multiple modules', () => {
      const result = TypeMetadataStorage.getObjectTypesMetadataByModules([
        ModuleA,
        ModuleB,
      ]);

      const targets = result.map((m) => m.target);
      expect(targets).toContain(ObjectTypeInModuleA);
      expect(targets).toContain(ObjectTypeInModuleB);
      expect(targets).toContain(ObjectTypeGlobal);
    });

    it('should return only global types when module has no registered types', () => {
      const result = TypeMetadataStorage.getObjectTypesMetadataByModules([
        ModuleC,
      ]);

      const targets = result.map((m) => m.target);
      expect(targets).toContain(ObjectTypeGlobal);
      expect(targets).not.toContain(ObjectTypeInModuleA);
      expect(targets).not.toContain(ObjectTypeInModuleB);
    });

    it('should handle direct module reference (not arrow function)', () => {
      const result = TypeMetadataStorage.getObjectTypesMetadataByModules([
        ModuleA,
      ]);

      const targets = result.map((m) => m.target);
      expect(targets).toContain(ObjectTypeInModuleADirect);
    });
  });

  describe('getInputTypesMetadataByModules', () => {
    it('should return input types registered in specified module', () => {
      const result = TypeMetadataStorage.getInputTypesMetadataByModules([
        ModuleA,
      ]);

      const targets = result.map((m) => m.target);
      expect(targets).toContain(InputTypeInModuleA);
      expect(targets).not.toContain(InputTypeInModuleB);
    });

    it('should include input types with no registerIn', () => {
      const result = TypeMetadataStorage.getInputTypesMetadataByModules([
        ModuleB,
      ]);

      const targets = result.map((m) => m.target);
      expect(targets).toContain(InputTypeGlobal);
      expect(targets).toContain(InputTypeInModuleB);
    });
  });

  describe('getInterfacesMetadataByModules', () => {
    it('should return interface types registered in specified module', () => {
      const result = TypeMetadataStorage.getInterfacesMetadataByModules([
        ModuleA,
      ]);

      const targets = result.map((m) => m.target);
      expect(targets).toContain(InterfaceTypeInModuleA);
      expect(targets).not.toContain(InterfaceTypeInModuleB);
    });

    it('should include interface types with no registerIn', () => {
      const result = TypeMetadataStorage.getInterfacesMetadataByModules([
        ModuleA,
      ]);

      const targets = result.map((m) => m.target);
      expect(targets).toContain(InterfaceTypeGlobal);
    });
  });

  describe('getArgumentsMetadataByModules', () => {
    it('should return args types registered in specified module', () => {
      const result = TypeMetadataStorage.getArgumentsMetadataByModules([
        ModuleA,
      ]);

      const targets = result.map((m) => m.target);
      expect(targets).toContain(ArgsTypeInModuleA);
      expect(targets).not.toContain(ArgsTypeInModuleB);
    });

    it('should include args types with no registerIn', () => {
      const result = TypeMetadataStorage.getArgumentsMetadataByModules([
        ModuleB,
      ]);

      const targets = result.map((m) => m.target);
      expect(targets).toContain(ArgsTypeGlobal);
    });
  });

  describe('getEnumsMetadataByModules', () => {
    it('should return enums registered in specified module', () => {
      const result = TypeMetadataStorage.getEnumsMetadataByModules([ModuleA]);

      const refs = result.map((m) => m.ref);
      expect(refs).toContain(StatusEnumA);
      expect(refs).not.toContain(StatusEnumB);
    });

    it('should include enums with no registerIn', () => {
      const result = TypeMetadataStorage.getEnumsMetadataByModules([ModuleA]);

      const refs = result.map((m) => m.ref);
      expect(refs).toContain(StatusEnumGlobal);
    });

    it('should filter correctly for ModuleB', () => {
      const result = TypeMetadataStorage.getEnumsMetadataByModules([ModuleB]);

      const refs = result.map((m) => m.ref);
      expect(refs).toContain(StatusEnumB);
      expect(refs).toContain(StatusEnumGlobal);
      expect(refs).not.toContain(StatusEnumA);
    });
  });

  describe('getUnionsMetadataByModules', () => {
    it('should return unions registered in specified module', () => {
      const result = TypeMetadataStorage.getUnionsMetadataByModules([ModuleA]);

      const names = result.map((m) => m.name);
      expect(names).toContain('UnionInModuleA');
      expect(names).not.toContain('UnionInModuleB');
    });

    it('should include unions with no registerIn', () => {
      const result = TypeMetadataStorage.getUnionsMetadataByModules([ModuleA]);

      const names = result.map((m) => m.name);
      expect(names).toContain('UnionGlobal');
    });

    it('should filter correctly for ModuleB', () => {
      const result = TypeMetadataStorage.getUnionsMetadataByModules([ModuleB]);

      const names = result.map((m) => m.name);
      expect(names).toContain('UnionInModuleB');
      expect(names).toContain('UnionGlobal');
      expect(names).not.toContain('UnionInModuleA');
    });
  });

  describe('default behavior (all types included when no module filter)', () => {
    it('should return all types when using getObjectTypesMetadata (no module filter)', () => {
      const result = TypeMetadataStorage.getObjectTypesMetadata();

      const targets = result.map((m) => m.target);
      expect(targets).toContain(ObjectTypeInModuleA);
      expect(targets).toContain(ObjectTypeInModuleB);
      expect(targets).toContain(ObjectTypeGlobal);
    });

    it('should return all input types when using getInputTypesMetadata (no module filter)', () => {
      const result = TypeMetadataStorage.getInputTypesMetadata();

      const targets = result.map((m) => m.target);
      expect(targets).toContain(InputTypeInModuleA);
      expect(targets).toContain(InputTypeInModuleB);
      expect(targets).toContain(InputTypeGlobal);
    });

    it('should return all enums when using getEnumsMetadata (no module filter)', () => {
      const result = TypeMetadataStorage.getEnumsMetadata();

      const refs = result.map((m) => m.ref);
      expect(refs).toContain(StatusEnumA);
      expect(refs).toContain(StatusEnumB);
      expect(refs).toContain(StatusEnumGlobal);
    });
  });
});
