import { Test } from '@nestjs/testing';
import { GraphQLEnumType, GraphQLObjectType, GraphQLUnionType } from 'graphql';
import {
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  ID,
  ObjectType,
  Query,
  Resolver,
  TypeMetadataStorage,
  createUnionType,
  registerEnumType,
} from '../../../lib/index.js';

enum MovieGenre {
  ACTION = 'ACTION',
  COMEDY = 'COMEDY',
}

registerEnumType(MovieGenre, {
  name: 'MovieGenre',
  directives: ['@tag(name: "public")'],
  valuesMap: {
    ACTION: {
      directives: ['@tag(name: "featured")'],
    },
  },
});

@ObjectType()
class Book {
  @Field(() => ID)
  id: string;
}

@ObjectType()
class Movie {
  @Field(() => ID)
  id: string;
}

const MediaUnion = createUnionType({
  name: 'Media',
  types: () => [Book, Movie] as const,
  directives: ['@tag(name: "public")'],
});

@Resolver()
class MediaResolver {
  @Query(() => MovieGenre)
  genre(): MovieGenre {
    return MovieGenre.ACTION;
  }

  @Query(() => MediaUnion)
  media(): typeof MediaUnion {
    return null;
  }
}

describe('Directives on enums and unions (issue #2920)', () => {
  let schemaFactory: GraphQLSchemaFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();

    schemaFactory = moduleRef.get(GraphQLSchemaFactory);
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('should attach directives to the generated enum type', async () => {
    const schema = await schemaFactory.create([MediaResolver]);

    const enumType = schema.getType('MovieGenre') as GraphQLEnumType;
    expect(enumType).toBeDefined();

    const directiveNames =
      enumType.astNode?.directives?.map((d) => d.name.value) ?? [];
    expect(directiveNames).toContain('tag');
  });

  it('should attach directives to individual enum values', async () => {
    const schema = await schemaFactory.create([MediaResolver]);

    const enumType = schema.getType('MovieGenre') as GraphQLEnumType;
    const actionValue = enumType.getValue('ACTION');
    expect(actionValue).toBeDefined();

    const directiveNames =
      actionValue!.astNode?.directives?.map((d) => d.name.value) ?? [];
    expect(directiveNames).toContain('tag');

    const comedyValue = enumType.getValue('COMEDY');
    expect(comedyValue!.astNode).toBeUndefined();
  });

  it('should attach directives to the generated union type', async () => {
    const schema = await schemaFactory.create([MediaResolver]);

    const unionType = schema.getType('Media') as GraphQLUnionType;
    expect(unionType).toBeDefined();

    const directiveNames =
      unionType.astNode?.directives?.map((d) => d.name.value) ?? [];
    expect(directiveNames).toContain('tag');
  });
});
