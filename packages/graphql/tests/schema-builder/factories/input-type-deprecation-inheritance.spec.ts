import { Test } from '@nestjs/testing';
import { GraphQLInputObjectType } from 'graphql';
import {
  Args,
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  InputType,
  IntersectionType,
  OmitType,
  PartialType,
  Query,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib/index.js';

@InputType()
class BaseInput {
  @Field({ nullable: true, deprecationReason: 'Use "name" instead' })
  legacyName?: string;

  @Field()
  name!: string;
}

@InputType()
class ChildInput extends BaseInput {
  @Field({ nullable: true })
  nickname?: string;
}

@InputType()
class PartialInput extends PartialType(BaseInput) {}

@InputType()
class OmitInput extends OmitType(BaseInput, ['name'] as const) {}

@InputType()
class NullableLegacyInput {
  @Field({ nullable: true, deprecationReason: 'Use "name" instead' })
  legacyName?: string;

  @Field({ nullable: true, deprecationReason: 'Use "name" instead' })
  alias?: string;
}

@InputType()
class RequiredLegacyInput {
  @Field()
  legacyName!: string;

  @Field({ nullable: true })
  alias?: string;
}

@InputType()
class IntersectionInput extends IntersectionType(
  NullableLegacyInput,
  RequiredLegacyInput,
) {}

@Resolver()
class DeprecationResolver {
  @Query(() => String)
  run(
    @Args('base') base: BaseInput,
    @Args('child') child: ChildInput,
    @Args('partial') partial: PartialInput,
    @Args('omit') omit: OmitInput,
    @Args('intersection') intersection: IntersectionInput,
  ): string {
    return 'ok';
  }
}

describe('Input field deprecation on inherited fields', () => {
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

  it.each(['BaseInput', 'ChildInput', 'PartialInput', 'OmitInput'])(
    'keeps the deprecation reason of "legacyName" on %s',
    async (name) => {
      const schema = await schemaFactory.create([DeprecationResolver]);
      const type = schema.getType(name) as GraphQLInputObjectType;

      expect(type.getFields().legacyName.deprecationReason).toBe(
        'Use "name" instead',
      );
    },
  );

  it('drops the deprecation of a field the intersection makes required', async () => {
    const schema = await schemaFactory.create([DeprecationResolver]);
    const type = schema.getType('IntersectionInput') as GraphQLInputObjectType;
    const fields = type.getFields();

    expect(fields.legacyName.deprecationReason).toBeUndefined();
    expect(fields.alias.deprecationReason).toBe('Use "name" instead');
  });
});
