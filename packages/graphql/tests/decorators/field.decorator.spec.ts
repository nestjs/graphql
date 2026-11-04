import { Test } from '@nestjs/testing';
import { GraphQLNonNull, GraphQLObjectType, graphql } from 'graphql';
import {
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  ObjectType,
  Query,
  Resolver,
  TypeMetadataStorage,
} from '../../lib/index.js';
import { FieldMiddleware } from '../../lib/interfaces/index.js';

const trimMiddleware: FieldMiddleware = async (_ctx, next) => {
  const value = (await next()) as string;
  return value?.trim();
};

/**
 * `@Field(undefined, options)` is accepted by the public overloads (e.g. from
 * a wrapper decorator forwarding an omitted type function), so the options
 * must not be dropped along with the type function.
 */
describe('@Field() with an "undefined" type function', () => {
  @ObjectType()
  class Sample {
    @Field(undefined, {
      nullable: true,
      description: 'sample description',
      middleware: [trimMiddleware],
    })
    value: string;
  }

  @Resolver(() => Sample)
  class SampleResolver {
    @Query(() => Sample)
    sample(): Sample {
      return { value: '  sample  ' };
    }
  }

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('should keep the options passed as the second argument', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();
    const schema = await moduleRef
      .get(GraphQLSchemaFactory)
      .create([SampleResolver]);

    const field = (schema.getType('Sample') as GraphQLObjectType).getFields()
      .value;
    expect(field.type).not.toBeInstanceOf(GraphQLNonNull);
    expect(field.description).toBe('sample description');

    const result = await graphql({
      schema,
      source: '{ sample { value } }',
      rootValue: { sample: () => ({ value: '  sample  ' }) },
    });
    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({ sample: { value: 'sample' } });
  });
});
