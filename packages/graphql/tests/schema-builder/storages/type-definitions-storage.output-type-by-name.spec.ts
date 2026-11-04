import { Test } from '@nestjs/testing';
import {
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  ObjectType,
  Query,
  registerEnumType,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib/index.js';
import { LazyMetadataStorage } from '../../../lib/schema-builder/storages/lazy-metadata.storage.js';
import {
  AmbiguousOutputTypeNameError,
  TypeDefinitionsStorage,
} from '../../../lib/schema-builder/storages/type-definitions.storage.js';
import { TypeDefinitionsGenerator } from '../../../lib/schema-builder/type-definitions.generator.js';

class PublicModule {}

@ObjectType({ registerIn: () => PublicModule })
class User {
  @Field()
  id!: string;
}

@ObjectType('User')
class AdminUser {
  @Field()
  id!: string;

  @Field()
  passwordHash!: string;
}

@ObjectType('Account')
class AccountView {
  @Field()
  id!: string;
}

@ObjectType({ isAbstract: true })
class Account {
  @Field()
  id!: string;

  @Field()
  secret!: string;
}

@ObjectType()
class Post {
  @Field()
  title!: string;

  @Field(() => 'User')
  author!: User;
}

@Resolver()
class PostResolver {
  @Query(() => Post)
  post(): Post {
    return { title: 'Hello', author: { id: '1' } };
  }
}

enum Status {
  ACTIVE = 'ACTIVE',
}

registerEnumType(Status, { name: 'Status' });
registerEnumType(Status, { name: 'Status' });

describe('TypeDefinitionsStorage output types referenced by name', () => {
  let generator: TypeDefinitionsGenerator;
  let storage: TypeDefinitionsStorage;
  let schemaFactory: GraphQLSchemaFactory;

  beforeAll(async () => {
    LazyMetadataStorage.load([User, AdminUser, AccountView, Account, Post]);
    TypeMetadataStorage.compile();

    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();

    generator = moduleRef.get(TypeDefinitionsGenerator);
    storage = moduleRef.get(TypeDefinitionsStorage);
    schemaFactory = moduleRef.get(GraphQLSchemaFactory);
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('should throw when multiple types are registered with the same name', () => {
    generator.generate({}, [PublicModule]);

    expect(() => storage.getOutputTypeAndExtract('User')).toThrow(
      AmbiguousOutputTypeNameError,
    );
    expect(storage.getOutputTypeAndExtract(User)).toBe(
      storage.getObjectTypeByTarget(User).type,
    );
    expect(storage.getOutputTypeAndExtract(AdminUser)).toBe(
      storage.getObjectTypeByTarget(AdminUser).type,
    );
  });

  it('should fail the schema build when a field references an ambiguous name', async () => {
    await expect(schemaFactory.create([PostResolver])).rejects.toThrow(
      AmbiguousOutputTypeNameError,
    );
  });

  it('should not resolve a name to an abstract type', () => {
    generator.generate({});

    expect(storage.getOutputTypeAndExtract('Account')).toBe(
      storage.getObjectTypeByTarget(AccountView).type,
    );
  });

  it('should not treat an enum registered twice as ambiguous', () => {
    generator.generate({});

    expect(storage.getOutputTypeAndExtract('Status')).toBe(
      storage.getEnumByObject(Status).type,
    );
  });
});
