import { Test } from '@nestjs/testing';
import { GraphQLInputObjectType, GraphQLSchema } from 'graphql';
import {
  Args,
  Directive,
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  ID,
  InputType,
  Query,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib/index.js';

@InputType({ isOneOf: true, isAbstract: true })
abstract class LookupInput {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field({ nullable: true })
  slug?: string;
}

@InputType()
class ProjectLookupInput extends LookupInput {}

@InputType()
class TeamLookupInput extends ProjectLookupInput {
  @Field({ nullable: true })
  handle?: string;
}

@InputType({ isOneOf: false })
class ProjectFilterInput extends LookupInput {}

@InputType()
@Directive('@oneOf')
class AccountSelector {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field({ nullable: true })
  email?: string;
}

@InputType()
class DerivedAccountSelector extends AccountSelector {}

@InputType()
class PlainInput {
  @Field({ nullable: true })
  name?: string;
}

@Resolver()
class LookupResolver {
  @Query(() => String)
  lookup(
    @Args('project') project: ProjectLookupInput,
    @Args('team') team: TeamLookupInput,
    @Args('filter') filter: ProjectFilterInput,
    @Args('account') account: AccountSelector,
    @Args('derivedAccount') derivedAccount: DerivedAccountSelector,
    @Args('plain') plain: PlainInput,
  ): string {
    return 'ok';
  }
}

describe('OneOf input types', () => {
  let schema: GraphQLSchema;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();
    schema = await moduleRef.get(GraphQLSchemaFactory).create([LookupResolver]);
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  const isOneOf = (name: string) =>
    (schema.getType(name) as GraphQLInputObjectType).isOneOf;

  it('should inherit "isOneOf" from a parent input type', () => {
    expect(isOneOf('ProjectLookupInput')).toBe(true);
    expect(isOneOf('TeamLookupInput')).toBe(true);
  });

  it('should let a derived input type opt out with "isOneOf: false"', () => {
    expect(isOneOf('ProjectFilterInput')).toBe(false);
  });

  it('should mark an input type with the "@oneOf" directive as OneOf', () => {
    expect(isOneOf('AccountSelector')).toBe(true);
    expect(isOneOf('DerivedAccountSelector')).toBe(true);
    expect(isOneOf('PlainInput')).toBe(false);
  });
});
