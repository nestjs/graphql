import { Test } from '@nestjs/testing';
import { GraphQLInputObjectType, GraphQLObjectType } from 'graphql';
import {
  Args,
  Extensions,
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  InputType,
  ObjectType,
  Query,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib/index.js';

@ObjectType()
class OType {
  @Field(() => String)
  @Extensions({ key: 'value' })
  OtypeMember!: string;
}

@InputType()
class IType {
  @Field(() => String)
  @Extensions({ key: 'value' })
  ItypeMember!: string;
}

@Resolver()
class ExtensionsResolver {
  @Query(() => OType)
  getOType(@Args('input', { type: () => IType }) input: IType): OType {
    return null;
  }
}

describe('@Extensions on @Field in @InputType (issue #3328)', () => {
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

  it('exposes @Extensions on @Field for both @ObjectType and @InputType (parity)', async () => {
    const schema = await schemaFactory.create([ExtensionsResolver], {
      skipCheck: true,
    });

    const objectType = schema.getType('OType') as GraphQLObjectType;
    expect(objectType).toBeDefined();
    const objectFields = objectType.getFields();
    expect(objectFields.OtypeMember.extensions).toBeDefined();
    expect(objectFields.OtypeMember.extensions.key).toBe('value');

    const inputType = schema.getType('IType') as GraphQLInputObjectType;
    expect(inputType).toBeDefined();
    const inputFields = inputType.getFields();
    // Regression: pre-fix this map was empty for input fields.
    expect(inputFields.ItypeMember.extensions).toBeDefined();
    expect(inputFields.ItypeMember.extensions.key).toBe('value');
  });
});
