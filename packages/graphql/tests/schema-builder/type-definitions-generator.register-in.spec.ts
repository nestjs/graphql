import { Test } from '@nestjs/testing';
import {
  ObjectType,
  InputType,
  InterfaceType,
  Field,
  registerEnumType,
  createUnionType,
  TypeMetadataStorage,
  GraphQLSchemaBuilderModule,
} from '../../lib';
import { TypeDefinitionsGenerator } from '../../lib/schema-builder/type-definitions.generator';
import { TypeDefinitionsStorage } from '../../lib/schema-builder/storages/type-definitions.storage';
import { LazyMetadataStorage } from '../../lib/schema-builder/storages/lazy-metadata.storage';

// Mock modules for testing
class UsersModule {}
class ProductsModule {}

// Types for UsersModule
@ObjectType({ registerIn: () => UsersModule })
class User {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  name!: string;
}

@InputType({ registerIn: () => UsersModule })
class CreateUserInput {
  @Field(() => String)
  name!: string;
}

@InterfaceType({ registerIn: () => UsersModule })
abstract class UserInterface {
  @Field(() => String)
  id!: string;
}

// Types for ProductsModule
@ObjectType({ registerIn: () => ProductsModule })
class Product {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  name!: string;
}

@InputType({ registerIn: () => ProductsModule })
class CreateProductInput {
  @Field(() => String)
  name!: string;
}

@InterfaceType({ registerIn: () => ProductsModule })
abstract class ProductInterface {
  @Field(() => String)
  id!: string;
}

// Global types (no registerIn)
@ObjectType()
class GlobalEntity {
  @Field(() => String)
  id!: string;
}

@InputType()
class GlobalInput {
  @Field(() => String)
  value!: string;
}

// Enums
enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

enum ProductStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD_OUT = 'SOLD_OUT',
}

enum GlobalStatus {
  YES = 'YES',
  NO = 'NO',
}

registerEnumType(UserStatus, {
  name: 'UserStatus',
  registerIn: () => UsersModule,
});

registerEnumType(ProductStatus, {
  name: 'ProductStatus',
  registerIn: () => ProductsModule,
});

registerEnumType(GlobalStatus, {
  name: 'GlobalStatus',
});

// Unions - will be created in beforeAll after ObjectTypes are loaded
let UserUnion: any;
let ProductUnion: any;

describe('TypeDefinitionsGenerator with includeModules', () => {
  let generator: TypeDefinitionsGenerator;
  let storage: TypeDefinitionsStorage;

  beforeAll(async () => {
    // Load all decorated class metadata
    LazyMetadataStorage.load([
      User,
      CreateUserInput,
      UserInterface,
      Product,
      CreateProductInput,
      ProductInterface,
      GlobalEntity,
      GlobalInput,
    ]);

    // Create unions after ObjectTypes are loaded
    UserUnion = createUnionType({
      name: 'UserUnion',
      types: () => [User, GlobalEntity] as const,
      registerIn: () => UsersModule,
    });

    ProductUnion = createUnionType({
      name: 'ProductUnion',
      types: () => [Product, GlobalEntity] as const,
      registerIn: () => ProductsModule,
    });

    // Load remaining metadata
    LazyMetadataStorage.load([]);

    TypeMetadataStorage.compile();

    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();

    generator = moduleRef.get(TypeDefinitionsGenerator);
    storage = moduleRef.get(TypeDefinitionsStorage);
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  describe('when includeModules is specified', () => {
    describe('UsersModule only', () => {
      beforeEach(() => {
        generator.generate({}, [UsersModule]);
      });

      it('should include ObjectTypes registered in UsersModule', () => {
        const userType = storage.getObjectTypeByTarget(User);
        expect(userType).toBeDefined();
      });

      it('should include global ObjectTypes (no registerIn)', () => {
        const globalType = storage.getObjectTypeByTarget(GlobalEntity);
        expect(globalType).toBeDefined();
      });

      it('should NOT include ObjectTypes registered in ProductsModule', () => {
        const productType = storage.getObjectTypeByTarget(Product);
        expect(productType).toBeUndefined();
      });

      it('should include InputTypes registered in UsersModule', () => {
        const inputType = storage.getInputTypeByTarget(CreateUserInput);
        expect(inputType).toBeDefined();
      });

      it('should NOT include InputTypes registered in ProductsModule', () => {
        const inputType = storage.getInputTypeByTarget(CreateProductInput);
        expect(inputType).toBeUndefined();
      });

      it('should include InterfaceTypes registered in UsersModule', () => {
        const interfaceType = storage.getInterfaceByTarget(UserInterface);
        expect(interfaceType).toBeDefined();
      });

      it('should NOT include InterfaceTypes registered in ProductsModule', () => {
        const interfaceType = storage.getInterfaceByTarget(ProductInterface);
        expect(interfaceType).toBeUndefined();
      });

      it('should include enums registered in UsersModule', () => {
        const enumDef = storage.getEnumByObject(UserStatus);
        expect(enumDef).toBeDefined();
      });

      it('should include global enums', () => {
        const enumDef = storage.getEnumByObject(GlobalStatus);
        expect(enumDef).toBeDefined();
      });

      it('should NOT include enums registered in ProductsModule', () => {
        const enumDef = storage.getEnumByObject(ProductStatus);
        expect(enumDef).toBeUndefined();
      });
    });

    describe('ProductsModule only', () => {
      beforeEach(() => {
        generator.generate({}, [ProductsModule]);
      });

      it('should include ObjectTypes registered in ProductsModule', () => {
        const productType = storage.getObjectTypeByTarget(Product);
        expect(productType).toBeDefined();
      });

      it('should NOT include ObjectTypes registered in UsersModule', () => {
        const userType = storage.getObjectTypeByTarget(User);
        expect(userType).toBeUndefined();
      });

      it('should include global ObjectTypes', () => {
        const globalType = storage.getObjectTypeByTarget(GlobalEntity);
        expect(globalType).toBeDefined();
      });

      it('should include InputTypes registered in ProductsModule', () => {
        const inputType = storage.getInputTypeByTarget(CreateProductInput);
        expect(inputType).toBeDefined();
      });

      it('should include global InputTypes', () => {
        const inputType = storage.getInputTypeByTarget(GlobalInput);
        expect(inputType).toBeDefined();
      });
    });

    describe('Both modules', () => {
      beforeEach(() => {
        generator.generate({}, [UsersModule, ProductsModule]);
      });

      it('should include ObjectTypes from both modules', () => {
        const userType = storage.getObjectTypeByTarget(User);
        const productType = storage.getObjectTypeByTarget(Product);

        expect(userType).toBeDefined();
        expect(productType).toBeDefined();
      });

      it('should include InputTypes from both modules', () => {
        const userInput = storage.getInputTypeByTarget(CreateUserInput);
        const productInput = storage.getInputTypeByTarget(CreateProductInput);

        expect(userInput).toBeDefined();
        expect(productInput).toBeDefined();
      });

      it('should include global types', () => {
        const globalType = storage.getObjectTypeByTarget(GlobalEntity);
        const globalInput = storage.getInputTypeByTarget(GlobalInput);

        expect(globalType).toBeDefined();
        expect(globalInput).toBeDefined();
      });

      it('should include enums from both modules and global', () => {
        const userEnum = storage.getEnumByObject(UserStatus);
        const productEnum = storage.getEnumByObject(ProductStatus);
        const globalEnum = storage.getEnumByObject(GlobalStatus);

        expect(userEnum).toBeDefined();
        expect(productEnum).toBeDefined();
        expect(globalEnum).toBeDefined();
      });
    });
  });

  describe('when includeModules is not specified (all types included)', () => {
    beforeEach(() => {
      generator.generate({});
    });

    it('should include all ObjectTypes', () => {
      const userType = storage.getObjectTypeByTarget(User);
      const productType = storage.getObjectTypeByTarget(Product);
      const globalType = storage.getObjectTypeByTarget(GlobalEntity);

      expect(userType).toBeDefined();
      expect(productType).toBeDefined();
      expect(globalType).toBeDefined();
    });

    it('should include all InputTypes', () => {
      const userInput = storage.getInputTypeByTarget(CreateUserInput);
      const productInput = storage.getInputTypeByTarget(CreateProductInput);
      const globalInput = storage.getInputTypeByTarget(GlobalInput);

      expect(userInput).toBeDefined();
      expect(productInput).toBeDefined();
      expect(globalInput).toBeDefined();
    });

    it('should include all enums', () => {
      const userEnum = storage.getEnumByObject(UserStatus);
      const productEnum = storage.getEnumByObject(ProductStatus);
      const globalEnum = storage.getEnumByObject(GlobalStatus);

      expect(userEnum).toBeDefined();
      expect(productEnum).toBeDefined();
      expect(globalEnum).toBeDefined();
    });
  });

  describe('TypeDefinitionsStorage.clear() functionality', () => {
    it('should clear previous definitions when generating new schema', () => {
      // First generate with UsersModule
      generator.generate({}, [UsersModule]);
      const userTypeFirst = storage.getObjectTypeByTarget(User);
      expect(userTypeFirst).toBeDefined();

      // Then generate with ProductsModule only
      generator.generate({}, [ProductsModule]);

      // User should no longer be present
      const userTypeSecond = storage.getObjectTypeByTarget(User);
      expect(userTypeSecond).toBeUndefined();

      // Product should now be present
      const productType = storage.getObjectTypeByTarget(Product);
      expect(productType).toBeDefined();
    });
  });
});
