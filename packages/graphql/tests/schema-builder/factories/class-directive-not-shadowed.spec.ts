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

@ObjectType()
@Directive('@tag(name: "public")')
class Account {
  @Field(() => ID)
  id: string;

  @Field()
  @Directive('@tag(name: "public")')
  email: string;
}

@Resolver(() => Account)
class AccountResolver {
  @Query(() => Account)
  me(): Account {
    return null;
  }
}

describe('Class-level directive not shadowed by identical field-level directive', () => {
  let accountType: GraphQLObjectType;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();

    const schemaFactory = moduleRef.get(GraphQLSchemaFactory);
    const schema = await schemaFactory.create([AccountResolver]);
    accountType = schema.getType('Account') as GraphQLObjectType;
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('should keep the class-level directive even when a field declares the same SDL', () => {
    const classDirectives = accountType.astNode?.directives ?? [];
    const classTagNames = classDirectives
      .filter((d) => d.name.value === 'tag')
      .map(
        (d) =>
          (d.arguments?.[0]?.value as { value?: string } | undefined)?.value,
      );
    expect(classTagNames).toContain('public');
  });

  it('should still keep the field-level directive', () => {
    const emailField = accountType.getFields().email;
    const fieldDirectives = emailField.astNode?.directives ?? [];
    const fieldTagNames = fieldDirectives
      .filter((d) => d.name.value === 'tag')
      .map(
        (d) =>
          (d.arguments?.[0]?.value as { value?: string } | undefined)?.value,
      );
    expect(fieldTagNames).toContain('public');
  });
});
