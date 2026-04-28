import { Test } from '@nestjs/testing';
import { GraphQLObjectType } from 'graphql';
import {
  Directive,
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  ID,
  ObjectType,
  Query,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib';

@ObjectType({ isAbstract: true })
@Directive('@key(fields: "id")')
class AbstractBase {
  @Field(() => ID)
  id: number;
}

@ObjectType()
class DerivedUser extends AbstractBase {
  @Field()
  name: string;
}

@Resolver(() => DerivedUser)
class DerivedUserResolver {
  @Query(() => DerivedUser)
  user(): DerivedUser {
    return null;
  }
}

describe('Directive inheritance from abstract @ObjectType', () => {
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

  it('should propagate class-level directives from an abstract parent to the derived type', async () => {
    const schema = await schemaFactory.create([DerivedUserResolver], {
      skipCheck: true,
    });

    const derivedType = schema.getType('DerivedUser') as GraphQLObjectType;
    expect(derivedType).toBeDefined();

    const directives = derivedType.astNode?.directives ?? [];
    const directiveNames = directives.map((d) => d.name.value);
    expect(directiveNames).toContain('key');
  });
});
