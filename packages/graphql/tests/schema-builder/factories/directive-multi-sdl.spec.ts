import { Test } from '@nestjs/testing';
import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import {
  Directive,
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  ID,
  ObjectType,
  Query,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib/index.js';

@ObjectType()
@Directive(['@tag(name: "internal")', '@tag(name: "restricted")'])
class User {
  @Field(() => ID)
  @Directive(['@tag(name: "pii")', '@tag(name: "audit")'])
  id: string;

  @Field()
  @Directive('@tag(name: "friendly")')
  name: string;
}

@Resolver(() => User)
class UserResolver {
  @Query(() => User)
  me(): User {
    return null;
  }
}

const tagArg = (
  directive: { arguments?: ReadonlyArray<{ value: unknown }> } | undefined,
): string | undefined =>
  (directive?.arguments?.[0]?.value as { value?: string } | undefined)?.value;

describe('@Directive with multiple SDL strings', () => {
  let schema: GraphQLSchema;
  let userType: GraphQLObjectType;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();

    const schemaFactory = moduleRef.get(GraphQLSchemaFactory);
    schema = await schemaFactory.create([UserResolver]);
    userType = schema.getType('User') as GraphQLObjectType;
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('should attach every class-level directive passed as an array', () => {
    const directives = userType.astNode?.directives ?? [];
    expect(directives.length).toBe(2);
    expect(directives.map((d) => tagArg(d))).toEqual(
      expect.arrayContaining(['internal', 'restricted']),
    );
  });

  it('should attach every property-level directive passed as an array', () => {
    const idField = userType.getFields().id;
    const directives = idField.astNode?.directives ?? [];
    expect(directives.length).toBe(2);
    expect(directives.map((d) => tagArg(d))).toEqual(
      expect.arrayContaining(['pii', 'audit']),
    );
  });

  it('should still accept a single SDL string', () => {
    const nameField = userType.getFields().name;
    const directives = nameField.astNode?.directives ?? [];
    expect(directives.length).toBe(1);
    expect(tagArg(directives[0])).toBe('friendly');
  });
});
