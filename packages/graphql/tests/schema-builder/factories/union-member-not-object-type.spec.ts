import { Test } from '@nestjs/testing';
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
} from '../../../lib';

@ObjectType()
class RegisteredCat {
  @Field(() => ID)
  id: string;
}

class StrayDog {
  @Field(() => ID)
  id: string;
}

const Pet = createUnionType({
  name: 'Pet',
  types: () => [RegisteredCat, StrayDog as any] as const,
});

@Resolver()
class PetResolver {
  @Query(() => Pet)
  pet(): typeof Pet {
    return null;
  }
}

describe('UnionDefinitionFactory error path', () => {
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

  it('should throw a descriptive error when a union member is not an @ObjectType', async () => {
    await expect(schemaFactory.create([PetResolver])).rejects.toThrowError(
      /Cannot build the "Pet" union: its member "StrayDog" is not registered as a @ObjectType\(\)\./,
    );
  });
});
