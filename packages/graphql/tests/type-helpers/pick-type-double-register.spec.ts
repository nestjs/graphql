import { Test } from '@nestjs/testing';
import { GraphQLInputObjectType } from 'graphql';
import {
  Args,
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  InputType,
  ObjectType,
  Query,
  Resolver,
  TypeMetadataStorage,
} from '../../lib';
import { PickType } from '../../lib/type-helpers';
import { LazyMetadataStorage } from '../../lib/schema-builder/storages/lazy-metadata.storage';

@InputType()
class PickSourceInput {
  @Field()
  a: string;

  @Field()
  b: string;
}

class PickedInput extends PickType(PickSourceInput, ['a'] as const) {}

describe('PickType duplicate registration regression', () => {
  beforeAll(() => {
    LazyMetadataStorage.load([PickSourceInput, PickedInput]);
    TypeMetadataStorage.compile();
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('should register the picked input type exactly once', () => {
    const inputs = TypeMetadataStorage.getInputTypesMetadata();
    const pickAbstract = Object.getPrototypeOf(PickedInput) as Function;
    const matches = inputs.filter((item) => item.target === pickAbstract);
    expect(matches).toHaveLength(1);
  });
});

describe('PickType with dual-decorated source and target', () => {
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

  it('should preserve picked fields when the generated type is also used as input', async () => {
    @InputType()
    @ObjectType('PickTypeDualDecoratedParentObject')
    class PickTypeDualDecoratedParent {
      @Field(() => String, { nullable: true })
      nullableField?: string;
    }

    @InputType()
    @ObjectType('PickTypeDualDecoratedChildObject')
    class PickTypeDualDecoratedChild extends PickType(
      PickTypeDualDecoratedParent,
      ['nullableField'] as const,
      ObjectType,
    ) {}

    @Resolver()
    class PickTypeDualDecoratedResolver {
      @Query(() => String)
      pickTypeDualDecorated(
        @Args('filter', {
          type: () => PickTypeDualDecoratedChild,
          nullable: true,
        })
        filter?: PickTypeDualDecoratedChild,
      ): string {
        return filter?.nullableField ?? '';
      }
    }

    LazyMetadataStorage.load([PickTypeDualDecoratedChild]);

    const schema = await schemaFactory.create([PickTypeDualDecoratedResolver]);
    const inputType = schema.getType(
      'PickTypeDualDecoratedChild',
    ) as GraphQLInputObjectType;

    expect(inputType).toBeDefined();
    expect(inputType.getFields().nullableField).toBeDefined();
  });
});
