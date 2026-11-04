import { Test } from '@nestjs/testing';
import { graphql, GraphQLSchema } from 'graphql';
import {
  createUnionType,
  Field,
  FieldMiddleware,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  ID,
  InterfaceType,
  ObjectType,
  Query,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib/index.js';

const requireClearance: FieldMiddleware = async () => 'redacted';

@InterfaceType()
abstract class Node {
  @Field(() => ID)
  id: string;
}

@ObjectType({ implements: () => [Node] })
class Document implements Node {
  id: string;

  @Field()
  content: string;
}

// Implements `Node` through its parent class only.
@ObjectType()
class ClassifiedDocument extends Document {
  @Field({ middleware: [requireClearance] })
  declare content: string;
}

@ObjectType({ implements: () => [Node] })
class TopSecretDocument extends ClassifiedDocument {}

// Not referenced by any field, so it is not part of the schema.
@ObjectType()
class DraftDocument extends Document {}

const ParentFirst = createUnionType({
  name: 'ParentFirst',
  types: () => [Document, ClassifiedDocument] as const,
});

@Resolver()
class NodesResolver {
  @Query(() => Node)
  node(): Node {
    return null;
  }

  @Query(() => ParentFirst)
  parentFirst(): typeof ParentFirst {
    return null;
  }

  @Query(() => ClassifiedDocument)
  classifiedDocument(): ClassifiedDocument {
    return null;
  }

  @Query(() => TopSecretDocument)
  topSecretDocument(): TopSecretDocument {
    return null;
  }
}

describe('Default resolveType of code-first abstract types', () => {
  let schema: GraphQLSchema;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();
    schema = await moduleRef.get(GraphQLSchemaFactory).create([NodesResolver]);
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  const create = <T extends object>(type: new () => T) =>
    Object.assign(new type(), { id: '1', content: 'secret' });

  const source = (field: string) => `{
    ${field} {
      __typename
      ... on Document { content }
      ... on ClassifiedDocument { content }
      ... on TopSecretDocument { content }
    }
  }`;

  it.each([
    ['Document', Document, 'secret'],
    ['ClassifiedDocument', ClassifiedDocument, 'redacted'],
    ['TopSecretDocument', TopSecretDocument, 'redacted'],
  ])(
    'should resolve an interface value to its most derived class (%s)',
    async (typename, type, content) => {
      const result = await graphql({
        schema,
        source: source('node'),
        rootValue: { node: () => create(type) },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({ node: { __typename: typename, content } });
    },
  );

  it('should resolve a union value to its most derived class', async () => {
    const result = await graphql({
      schema,
      source: `{
        parentFirst {
          __typename
          ... on Document { content }
          ... on ClassifiedDocument { content }
        }
      }`,
      rootValue: { parentFirst: () => create(ClassifiedDocument) },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      parentFirst: { __typename: 'ClassifiedDocument', content: 'redacted' },
    });
  });

  it('should fall back to a class in the schema for a class outside it', async () => {
    expect(schema.getType('DraftDocument')).toBeUndefined();

    const result = await graphql({
      schema,
      source: source('node'),
      rootValue: { node: () => create(DraftDocument) },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      node: { __typename: 'Document', content: 'secret' },
    });
  });
});
