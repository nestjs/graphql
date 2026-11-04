import { Test } from '@nestjs/testing';
import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import {
  Args,
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  ID,
  Int,
  ObjectType,
  Query,
  ResolveField,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib/index.js';

/**
 * One process can build several schemas from the same storage, each from its
 * own resolver classes (e.g. `GraphQLModule.forRoot({ include })` per
 * endpoint). A `@ResolveField()` of one schema must not leak into another one.
 */

@ObjectType()
class Account {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  bio: string;
}

@Resolver(() => Account)
class AdminAccountResolver {
  @Query(() => [Account])
  adminAccounts(): Account[] {
    return [];
  }

  @ResolveField(() => String)
  secret(): string {
    return 'secret';
  }

  @ResolveField(() => [String])
  tags(
    @Args('first', { type: () => Int, nullable: true }) first?: number,
  ): string[] {
    return [];
  }

  @ResolveField(() => String)
  bio(@Args('raw', { type: () => Boolean }) raw: boolean): string {
    return '';
  }
}

@Resolver(() => Account)
class PublicAccountResolver {
  @Query(() => [Account])
  accounts(): Account[] {
    return [];
  }

  @ResolveField(() => [String])
  tags(@Args('first', { type: () => Int }) first: number): string[] {
    return [];
  }
}

describe('TypeMetadataStorage - several schemas in one process', () => {
  let schemaFactory: GraphQLSchemaFactory;

  const getAccountFields = (schema: GraphQLSchema) =>
    (schema.getType('Account') as GraphQLObjectType).getFields();
  const getArgType = (schema: GraphQLSchema, field: string, arg: string) =>
    getAccountFields(schema)
      [field].args.find((item) => item.name === arg)
      ?.type.toString();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();

    schemaFactory = moduleRef.get(GraphQLSchemaFactory);
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('should build each schema from its own field resolvers only', async () => {
    const adminSchema = await schemaFactory.create([AdminAccountResolver]);
    const publicSchema = await schemaFactory.create([PublicAccountResolver]);
    const adminSchemaAgain = await schemaFactory.create([AdminAccountResolver]);

    expect(getAccountFields(publicSchema).secret).toBeUndefined();
    expect(getArgType(publicSchema, 'tags', 'first')).toBe('Int!');
    expect(getAccountFields(publicSchema).bio.args).toEqual([]);

    for (const schema of [adminSchema, adminSchemaAgain]) {
      expect(getAccountFields(schema).secret).toBeDefined();
      expect(getArgType(schema, 'tags', 'first')).toBe('Int');
      expect(getArgType(schema, 'bio', 'raw')).toBe('Boolean!');
    }
  });
});
