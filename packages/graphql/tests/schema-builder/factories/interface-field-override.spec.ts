import { Test } from '@nestjs/testing';
import { graphql, GraphQLObjectType, GraphQLSchema } from 'graphql';
import {
  Extensions,
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
  UseFieldMiddleware,
} from '../../../lib/index.js';

const wrap =
  (name: string): FieldMiddleware =>
  async (_ctx, next) =>
    `${name}(${await next()})`;

@InterfaceType()
abstract class Document {
  @Field(() => ID)
  id: string;

  @Field({ description: 'base' })
  author: string;
}

@InterfaceType({ implements: () => [Document] })
abstract class ConfidentialDocument implements Document {
  id: string;

  @UseFieldMiddleware(wrap('decorator'))
  @Extensions({ role: 'ADMIN' })
  @Field({ description: 'override', middleware: [wrap('option')] })
  author: string;
}

@InterfaceType({ implements: () => [ConfidentialDocument, Document] })
abstract class SealedDocument implements ConfidentialDocument {
  id: string;
  author: string;

  @Field()
  seal: string;
}

@ObjectType({ implements: () => [ConfidentialDocument, Document] })
class DescendantFirst implements ConfidentialDocument {
  id: string;
  author: string;
}

@ObjectType({ implements: () => [Document, ConfidentialDocument] })
class AncestorFirst implements ConfidentialDocument {
  id: string;
  author: string;
}

@ObjectType({
  implements: () => [SealedDocument, ConfidentialDocument, Document],
})
class Sealed implements SealedDocument {
  id: string;
  author: string;
  seal: string;
}

@Resolver()
class DocumentsResolver {
  @Query(() => DescendantFirst)
  descendantFirst(): DescendantFirst {
    return null;
  }

  @Query(() => AncestorFirst)
  ancestorFirst(): AncestorFirst {
    return null;
  }

  @Query(() => Sealed)
  sealed(): Sealed {
    return null;
  }
}

describe('A field redeclared by an interface that implements another interface', () => {
  let schema: GraphQLSchema;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();
    schema = await moduleRef
      .get(GraphQLSchemaFactory)
      .create([DocumentsResolver]);
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it.each(['DescendantFirst', 'AncestorFirst', 'Sealed'])(
    'should build %s.author from the closest declaration',
    (typeName) => {
      const author = (schema.getType(typeName) as GraphQLObjectType).getFields()
        .author;

      expect(author.description).toBe('override');
      expect(author.extensions).toMatchObject({ role: 'ADMIN' });
    },
  );

  it('should run the middleware of the closest declaration', async () => {
    const document = () => ({ id: '1', author: 'value', seal: 'value' });
    const result = await graphql({
      schema,
      source:
        '{ descendantFirst { author } ancestorFirst { author } sealed { author seal } }',
      rootValue: {
        descendantFirst: document,
        ancestorFirst: document,
        sealed: document,
      },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      descendantFirst: { author: 'option(decorator(value))' },
      ancestorFirst: { author: 'option(decorator(value))' },
      sealed: { author: 'option(decorator(value))', seal: 'value' },
    });
  });
});
