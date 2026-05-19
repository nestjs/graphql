import { Test } from '@nestjs/testing';
import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  printSchema,
} from 'graphql';
import {
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  ObjectType,
  Query,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib';

@ObjectType('Author')
class AuthorModel {
  @Field(() => String)
  id!: string;
}

@Resolver()
class AuthorResolver {
  @Query(() => 'Author')
  author(): AuthorModel {
    return { id: 'author-1' };
  }
}

describe('Output type resolution by GraphQL name', () => {
  let schema: GraphQLSchema;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();

    const schemaFactory = moduleRef.get(GraphQLSchemaFactory);
    schema = await schemaFactory.create([AuthorResolver]);
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('builds the schema when a resolver returns an output type by GraphQL name', () => {
    expect(printSchema(schema)).toContain('author: Author!');
  });

  it('resolves the query field to the named output type', () => {
    const queryType = schema.getQueryType();
    const authorField = queryType?.getFields().author;

    expect(authorField).toBeDefined();
    expect(authorField!.type).toBeInstanceOf(GraphQLNonNull);
    expect(
      (authorField!.type as GraphQLNonNull<GraphQLObjectType>).ofType,
    ).toBe(schema.getType('Author'));
  });
});
