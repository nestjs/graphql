import { Test } from '@nestjs/testing';
import {
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  ID,
  InterfaceType,
  ObjectType,
  Query,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib';

@InterfaceType()
abstract class RegisteredEntity {
  @Field(() => ID)
  id: string;
}

abstract class NotRegisteredEntity {
  @Field(() => ID)
  id: string;
}

@ObjectType({ implements: () => [RegisteredEntity, NotRegisteredEntity] })
class Hybrid extends RegisteredEntity {
  @Field()
  label: string;
}

@Resolver()
class HybridResolver {
  @Query(() => Hybrid)
  hybrid(): Hybrid {
    return null;
  }
}

describe('ObjectType / InterfaceType "implements" error path', () => {
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

  it('should throw a descriptive error when implements references a class without @InterfaceType', async () => {
    await expect(schemaFactory.create([HybridResolver])).rejects.toThrowError(
      /"Hybrid" lists "NotRegisteredEntity" in its "implements" option, but "NotRegisteredEntity" is not registered as an @InterfaceType\(\)\./,
    );
  });
});
