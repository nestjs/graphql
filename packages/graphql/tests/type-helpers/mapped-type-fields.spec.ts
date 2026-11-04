import { Test } from '@nestjs/testing';
import { GraphQLInputObjectType, GraphQLSchema, printType } from 'graphql';
import {
  Args,
  ArgsType,
  Field,
  FieldMiddleware,
  getFieldsAndDecoratorForType,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  ID,
  InputType,
  Int,
  ObjectType,
  Query,
  registerEnumType,
  Resolver,
  TypeMetadataStorage,
} from '../../lib/index.js';
import {
  IntersectionType,
  OmitType,
  PartialType,
  PickType,
} from '../../lib/type-helpers/index.js';

enum Visibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}
registerEnumType(Visibility, { name: 'MappedTypeVisibility' });

@InputType({ isAbstract: true })
class BaseProfileInput {
  @Field(() => String, { nullable: true })
  visibility?: string;
}

@InputType()
class CreateProfileInput extends BaseProfileInput {
  @Field(() => Visibility)
  visibility: Visibility;

  @Field({ nullable: true })
  name?: string;
}

@InputType()
class CloneProfileInput extends OmitType(CreateProfileInput, [
  'name',
] as const) {}

@ObjectType({ isAbstract: true })
abstract class Entity {
  @Field(() => ID)
  id: string;

  @Field()
  isAdmin: boolean;
}

@InputType()
class CreateNoteInput extends Entity {
  @Field()
  text: string;
}

@InputType()
class UpdateNoteInput extends PartialType(CreateNoteInput) {}

@ObjectType()
@InputType('AccountInput')
class Account extends Entity {
  @Field()
  name: string;
}

@InputType()
class UpdateAccountInput extends PartialType(Account, InputType) {}

@ArgsType()
class PageArgs {
  @Field(() => Int, { nullable: true })
  take?: number;
}

class UndecoratedArgs extends PageArgs {}

@ArgsType()
class SearchArgs extends UndecoratedArgs {
  @Field({ nullable: true })
  search?: string;
}

@ArgsType()
class PartialSearchArgs extends PartialType(SearchArgs) {}

@InputType()
class AccountUpdate {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;
}

@InputType()
class PickThenPartial extends IntersectionType(
  PickType(AccountUpdate, ['id'] as const),
  PartialType(AccountUpdate),
) {}

@InputType()
class PartialThenPick extends IntersectionType(
  PartialType(AccountUpdate),
  PickType(AccountUpdate, ['id'] as const),
) {}

@InputType()
class CreateUserInput {
  @Field()
  name: string;

  @Field()
  status: string = 'active';

  @Field({ defaultValue: 'member' })
  role: string;
}

@InputType()
class PatchUserInput extends PartialType(CreateUserInput, {
  omitDefaultValues: true,
}) {}

@InputType()
class OptionalNoteInput {
  @Field({ nullable: true, defaultValue: null })
  note?: string;
}

@InputType()
class RequiredNoteInput {
  @Field()
  note: string;
}

@InputType()
class NoteInput extends IntersectionType(
  OptionalNoteInput,
  RequiredNoteInput,
) {}

const middlewareA: FieldMiddleware = (_, next) => next();
const middlewareB: FieldMiddleware = (_, next) => next();

@ObjectType()
class TaggedA {
  @Field(() => [String], { nullable: 'items', middleware: [middlewareA] })
  tags: string[];
}

@ObjectType()
class TaggedB {
  @Field(() => [String], {
    nullable: 'itemsAndList',
    middleware: [middlewareB],
  })
  tags?: string[];
}

@Resolver()
class MappedTypesResolver {
  @Query(() => String)
  mapped(
    @Args('create') create: CreateProfileInput,
    @Args('clone') clone: CloneProfileInput,
    @Args('updateNote') updateNote: UpdateNoteInput,
    @Args('account') account: Account,
    @Args('updateAccount') updateAccount: UpdateAccountInput,
    @Args('pickThenPartial') pickThenPartial: PickThenPartial,
    @Args('partialThenPick') partialThenPick: PartialThenPick,
    @Args('patchUser') patchUser: PatchUserInput,
    @Args('note') note: NoteInput,
  ): string {
    return 'ok';
  }

  @Query(() => String)
  search(@Args() args: PartialSearchArgs): string {
    return 'ok';
  }
}

describe('Mapped type fields', () => {
  let schema: GraphQLSchema;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();
    schema = await moduleRef
      .get(GraphQLSchemaFactory)
      .create([MappedTypesResolver]);
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  const print = (name: string) =>
    printType(schema.getType(name) as GraphQLInputObjectType);

  it('should map the declaration a class re-declares, not the inherited one', () => {
    expect(print('CloneProfileInput')).toEqual(
      [
        'input CloneProfileInput {',
        '  visibility: MappedTypeVisibility!',
        '}',
      ].join('\n'),
    );
  });

  it('should not map the fields of a parent of another kind of type', () => {
    expect(print('UpdateNoteInput')).toEqual(
      ['input UpdateNoteInput {', '  text: String', '}'].join('\n'),
    );
    expect(print('AccountInput')).toEqual(
      ['input AccountInput {', '  name: String!', '}'].join('\n'),
    );
    expect(print('UpdateAccountInput')).toEqual(
      ['input UpdateAccountInput {', '  name: String', '}'].join('\n'),
    );
  });

  it('should map the fields an arguments type inherits through a plain class', () => {
    expect(
      getFieldsAndDecoratorForType(PartialSearchArgs).fields.map(
        (field) => field.name,
      ),
    ).toEqual(['take', 'search']);
  });

  it('should keep a shared field non-nullable unless both types allow null', () => {
    expect(print('PickThenPartial')).toEqual(
      ['input PickThenPartial {', '  id: ID!', '  email: String', '}'].join(
        '\n',
      ),
    );
    expect(print('PartialThenPick')).toEqual(
      ['input PartialThenPick {', '  id: ID!', '  email: String', '}'].join(
        '\n',
      ),
    );
    // the "null" default of the nullable declaration is dropped
    expect(print('NoteInput')).toEqual(
      ['input NoteInput {', '  note: String!', '}'].join('\n'),
    );
  });

  it('should omit the property initializers of a partial type with "omitDefaultValues"', () => {
    expect(print('PatchUserInput')).toEqual(
      [
        'input PatchUserInput {',
        '  name: String',
        '  status: String',
        '  role: String',
        '}',
      ].join('\n'),
    );
  });
  it('should keep the stricter list nullability and the middleware of both types', () => {
    const { fields } = getFieldsAndDecoratorForType(
      IntersectionType(TaggedB, TaggedA),
    );
    expect(fields).toHaveLength(1);
    expect(fields[0].options.nullable).toEqual('items');
    expect(fields[0].middleware).toEqual([middlewareB, middlewareA]);
  });
});
