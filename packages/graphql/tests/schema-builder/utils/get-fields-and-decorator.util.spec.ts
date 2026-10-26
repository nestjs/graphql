import { Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GraphQLInputObjectType, GraphQLList, printType } from 'graphql';
import {
  Args,
  Field,
  getFieldsAndDecoratorForType,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  InputType,
  Int,
  ObjectType,
  PropertyMetadata,
  Query,
  Resolver,
  TypeMetadataStorage,
  UnableToFindFieldsError,
} from '../../../lib/index.js';

@ObjectType({ isAbstract: true })
class FieldsBaseModel {
  @Field()
  id: string;
}

@ObjectType()
class FieldsTestModel extends FieldsBaseModel {
  @Field(() => Int, { nullable: true, description: 'Number of items' })
  count?: number;

  @Field(() => [String])
  tags: string[];
}

@InputType()
class FieldsTestInput {
  @Field()
  name: string;
}

/**
 * A custom mapped type helper, built the same way as the built-in ones:
 * every field of the source type becomes an optional list of its type.
 */
function FilterType<T>(classRef: Type<T>): Type<unknown> {
  const { fields } = getFieldsAndDecoratorForType(classRef);

  @InputType({ isAbstract: true })
  abstract class FilterInput {}

  fields.forEach((field: PropertyMetadata) => {
    const typeRef = field.typeFn();
    Field(() => [typeRef], { nullable: true })(
      FilterInput.prototype,
      field.name,
    );
  });
  return FilterInput as Type<unknown>;
}

describe('getFieldsAndDecoratorForType', () => {
  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('should return own and inherited fields with their metadata', () => {
    const { fields } = getFieldsAndDecoratorForType(FieldsTestModel);

    expect(fields.map((field) => field.name)).toEqual(['id', 'count', 'tags']);

    const count = fields.find((field) => field.name === 'count')!;
    expect(count.typeFn()).toBe(Int);
    expect(count.options.nullable).toBe(true);
    expect(count.description).toBe('Number of items');

    const tags = fields.find((field) => field.name === 'tags')!;
    expect(tags.typeFn()).toBe(String);
    expect(tags.options.isArray).toBe(true);
  });

  it('should return the class decorator that matches the type kind', () => {
    expect(getFieldsAndDecoratorForType(FieldsTestModel).decoratorFactory).toBe(
      ObjectType,
    );
    expect(getFieldsAndDecoratorForType(FieldsTestInput).decoratorFactory).toBe(
      InputType,
    );
  });

  it('should throw an UnableToFindFieldsError for a class that is not a GraphQL type', () => {
    class NotAGraphQLType {}

    expect(() => getFieldsAndDecoratorForType(NotAGraphQLType)).toThrow(
      UnableToFindFieldsError,
    );
  });

  it('should allow building a custom mapped type', async () => {
    @InputType()
    class FieldsTestModelFilter extends FilterType(FieldsTestModel) {}

    @Resolver()
    class FieldsTestResolver {
      @Query(() => [FieldsTestModel])
      models(
        @Args('filter', { type: () => FieldsTestModelFilter, nullable: true })
        filter?: FieldsTestModelFilter,
      ): FieldsTestModel[] {
        return [];
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();
    const schema = await moduleRef
      .get(GraphQLSchemaFactory)
      .create([FieldsTestResolver]);

    const filterType = schema.getType(
      'FieldsTestModelFilter',
    ) as GraphQLInputObjectType;
    expect(filterType).toBeInstanceOf(GraphQLInputObjectType);
    expect(filterType.getFields().count.type).toBeInstanceOf(GraphQLList);
    expect(printType(filterType)).toEqual(
      [
        'input FieldsTestModelFilter {',
        '  id: [String!]',
        '  count: [Int!]',
        '  tags: [String!]',
        '}',
      ].join('\n'),
    );
  });
});
