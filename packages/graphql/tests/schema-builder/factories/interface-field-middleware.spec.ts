import { Test } from '@nestjs/testing';
import { graphql, GraphQLSchema } from 'graphql';
import {
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
abstract class Base {
  @Field(() => ID)
  id: string;

  @UseFieldMiddleware(wrap('decorator'))
  @Field({ middleware: [wrap('option')] })
  ownerEmail: string;
}

// The layout of the `IRecipe extends Base` code-first fixture: the object
// type lists `IRecipe` in `implements`, and reaches `Base` through `extends`.
@InterfaceType()
abstract class IRecipe extends Base {
  @Field({ middleware: [wrap('option')] })
  internalNotes: string;
}

@ObjectType({ implements: () => IRecipe })
class Recipe extends IRecipe {}

@ObjectType()
class Note extends Base {}

@ObjectType({ isAbstract: true })
class AbstractNote extends Base {}

@ObjectType()
class LeafNote extends AbstractNote {}

@Resolver()
class InterfaceFieldMiddlewareResolver {
  @Query(() => Recipe)
  recipe(): Recipe {
    return null;
  }

  @Query(() => Note)
  note(): Note {
    return null;
  }

  @Query(() => LeafNote)
  leafNote(): LeafNote {
    return null;
  }
}

describe('Field middleware on fields inherited from an @InterfaceType() class', () => {
  let schema: GraphQLSchema;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();
    schema = await moduleRef
      .get(GraphQLSchemaFactory)
      .create([InterfaceFieldMiddlewareResolver], {
        fieldMiddleware: [wrap('global')],
      });
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  const value = () => ({
    id: '1',
    ownerEmail: 'value',
    internalNotes: 'value',
  });

  it('should run the middleware of an interface field reached through "extends"', async () => {
    const result = await graphql({
      schema,
      source: '{ recipe { ownerEmail internalNotes } }',
      rootValue: { recipe: value },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      recipe: {
        ownerEmail: 'global(option(decorator(value)))',
        internalNotes: 'global(option(value))',
      },
    });
  });

  it('should run the middleware when an object type extends the interface class', async () => {
    const result = await graphql({
      schema,
      source: '{ note { id ownerEmail } leafNote { id ownerEmail } }',
      rootValue: { note: value, leafNote: value },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      note: { id: 'global(1)', ownerEmail: 'global(option(decorator(value)))' },
      leafNote: {
        id: 'global(1)',
        ownerEmail: 'global(option(decorator(value)))',
      },
    });
  });
});
