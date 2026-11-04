import { Test } from '@nestjs/testing';
import {
  GraphQLInputObjectType,
  GraphQLSchema,
  isRequiredArgument,
  isRequiredInputField,
} from 'graphql';
import {
  Args,
  ArgsType,
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  InputType,
  Int,
  Query,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib/index.js';
import { DefaultNullableConflictError } from '../../../lib/schema-builder/errors/default-nullable-conflict.error.js';

@ArgsType()
class OptionalOwnerArgs {
  @Field(() => Int, { nullable: true })
  ownerId?: number = null;
}

// Re-declared as non-nullable, while the instance still carries the "null"
// initializer of the base class.
@ArgsType()
class RequiredOwnerArgs extends OptionalOwnerArgs {
  @Field(() => Int)
  ownerId: number;
}

@InputType()
class OptionalOwnerInput {
  @Field(() => Int, { nullable: true })
  ownerId?: number = null;
}

@InputType()
class RequiredOwnerInput extends OptionalOwnerInput {
  @Field(() => Int)
  ownerId: number;
}

@Resolver()
class OwnerResolver {
  @Query(() => String)
  optional(@Args() args: OptionalOwnerArgs): string {
    return 'ok';
  }

  @Query(() => String)
  inherited(@Args() args: RequiredOwnerArgs): string {
    return 'ok';
  }

  @Query(() => String)
  input(
    @Args('optional') optional: OptionalOwnerInput,
    @Args('required') required: RequiredOwnerInput,
  ): string {
    return 'ok';
  }
}

@Resolver()
class ExplicitNullDefaultResolver {
  @Query(() => String)
  explicit(
    @Args('ownerId', { type: () => Int, defaultValue: null }) ownerId: number,
  ): string {
    return 'ok';
  }
}

describe('"null" default values', () => {
  let schemaFactory: GraphQLSchemaFactory;
  let schema: GraphQLSchema;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();
    schemaFactory = moduleRef.get(GraphQLSchemaFactory);
    schema = await schemaFactory.create([OwnerResolver]);
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('should keep a "null" initializer as the default of a nullable argument', () => {
    const [ownerId] = schema.getQueryType().getFields().optional.args;
    expect(ownerId.defaultValue).toBeNull();
  });

  it('should not let a "null" initializer make a non-nullable argument optional', () => {
    const [ownerId] = schema.getQueryType().getFields().inherited.args;
    expect(ownerId.defaultValue).toBeUndefined();
    expect(isRequiredArgument(ownerId)).toBe(true);
  });

  it('should not let a "null" initializer make a non-nullable input field optional', () => {
    const optional = schema.getType(
      'OptionalOwnerInput',
    ) as GraphQLInputObjectType;
    expect(optional.getFields().ownerId.defaultValue).toBeNull();

    const required = schema.getType(
      'RequiredOwnerInput',
    ) as GraphQLInputObjectType;
    expect(required.getFields().ownerId.defaultValue).toBeUndefined();
    expect(isRequiredInputField(required.getFields().ownerId)).toBe(true);
  });

  it('should reject an explicit "null" default on a non-nullable argument', async () => {
    await expect(
      schemaFactory.create([ExplicitNullDefaultResolver]),
    ).rejects.toThrow(DefaultNullableConflictError);
  });
});
