import { ApolloServer } from '@apollo/server';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import {
  Args,
  ArgsType,
  Field,
  Float,
  GraphQLModule,
  ID,
  InputType,
  Int,
  ObjectType,
  Query,
  ResolveField,
  Resolver,
  registerEnumType,
} from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { MinLength } from 'class-validator';
import { gql } from 'graphql-tag';
import { ApolloDriver, ApolloDriverConfig } from '../../lib/index.js';
import { expectSingleResult } from '../utils/assertion-utils.js';

@InputType()
class FiltersInput {
  @Field(() => String, { name: 'and', nullable: true })
  $and?: string;

  @Field(() => [FiltersInput], { nullable: true })
  nested?: FiltersInput[];
}

@ArgsType()
class BaseArgs {
  @Field(() => String, { name: 'inherited_arg', nullable: true })
  inheritedArg?: string;
}

@ArgsType()
class SomeArgsClass extends BaseArgs {
  @Field(() => String, { name: 'some_arg' })
  someArg: string;

  @Field(() => String, { nullable: true })
  untouchedArg?: string;

  @Field(() => FiltersInput, { nullable: true })
  filters?: FiltersInput;
}

@ObjectType()
class AnotherObject {
  @Field(() => [String])
  keys: string[];

  @Field(() => String, { nullable: true })
  someArg?: string;

  @Field(() => String, { nullable: true })
  inheritedArg?: string;

  @Field(() => String, { nullable: true })
  untouchedArg?: string;

  @Field(() => [String], { nullable: true })
  filtersKeys?: string[];

  @Field(() => String, { nullable: true })
  filtersAnd?: string;

  @Field(() => String, { nullable: true })
  nestedAnd?: string;

  @Field(() => String, { nullable: true })
  resolvedField?: string;
}

enum SomeEnum {
  A = 'A',
  B = 'B',
}
registerEnumType(SomeEnum, { name: 'SomeEnum' });

@ArgsType()
class ScalarArgs {
  @Field(() => Int, { name: 'int_arg' })
  intArg: number;

  @Field(() => Float, { name: 'float_arg' })
  floatArg: number;

  @Field(() => Boolean, { name: 'bool_arg' })
  boolArg: boolean;

  @Field(() => ID, { name: 'id_arg' })
  idArg: string;

  @Field(() => SomeEnum, { name: 'enum_arg' })
  enumArg: SomeEnum;

  @Field(() => [Int], { name: 'list_arg' })
  listArg: number[];

  @Field(() => String, { name: 'null_arg', nullable: true })
  nullArg?: string;
}

@InputType()
class ValidatedInput {
  @Field(() => String, { name: 'and' })
  @MinLength(2)
  $and: string;
}

@InputType()
class ChainedInput {
  // the schema name of one property is the class name of another
  @Field(() => String, { name: 'a', nullable: true })
  b?: string;

  @Field(() => String, { name: 'b', nullable: true })
  c?: string;
}

@InputType()
class NestingInput {
  // no renamed field of its own, only the nested type has one
  @Field(() => FiltersInput, { nullable: true })
  filters?: FiltersInput;
}

@ObjectType()
class Probe {
  @Field(() => String)
  json: string;
}

@Resolver(() => AnotherObject)
class AnotherObjectResolver {
  @Query(() => AnotherObject)
  getAnotherObject(@Args() args: SomeArgsClass): AnotherObject {
    return {
      keys: Object.keys(args).sort(),
      someArg: args.someArg,
      inheritedArg: args.inheritedArg,
      untouchedArg: args.untouchedArg,
      ...this.describeFilters(args.filters),
    };
  }

  @Query(() => AnotherObject)
  getByFilters(@Args('filters') filters: FiltersInput): AnotherObject {
    return {
      keys: Object.keys(filters).sort(),
      ...this.describeFilters(filters),
    };
  }

  @Query(() => AnotherObject)
  validate(
    @Args('input', new ValidationPipe({ transform: true }))
    input: ValidatedInput,
  ): AnotherObject {
    return { keys: Object.keys(input).sort(), filtersAnd: input.$and };
  }

  @ResolveField(() => String, { nullable: true })
  resolvedField(@Args() args: SomeArgsClass): string {
    return args.someArg;
  }

  @Query(() => String)
  scalars(@Args() args: ScalarArgs): string {
    // the replacer keeps the output order stable
    return JSON.stringify(args, Object.keys(args).sort());
  }

  @Query(() => String)
  chained(@Args('input') input: ChainedInput): string {
    return JSON.stringify(input, Object.keys(input).sort());
  }

  @Query(() => String)
  listOfFilters(
    @Args('filters', { type: () => [FiltersInput] }) filters: FiltersInput[],
  ): string {
    return JSON.stringify(filters.map((filter) => Object.keys(filter).sort()));
  }

  private describeFilters(filters?: FiltersInput) {
    return {
      filtersKeys: filters && Object.keys(filters).sort(),
      filtersAnd: filters?.$and,
      nestedAnd: filters?.nested?.[0]?.$and,
    };
  }
}

describe('Renamed args (@Field({ name }) on @ArgsType/@InputType classes)', () => {
  let app: INestApplication;
  let apolloClient: ApolloServer;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
        }),
      ],
      providers: [AnotherObjectResolver],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    apolloClient =
      app.get<GraphQLModule<ApolloDriver>>(GraphQLModule).graphQlAdapter
        ?.instance;
  });

  afterEach(async () => {
    await app.close();
  });

  it('should hand the resolver the property names declared by the args class', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          getAnotherObject(
            some_arg: "a"
            inherited_arg: "b"
            untouchedArg: "c"
            filters: { and: "d", nested: [{ and: "e" }] }
          ) {
            keys
            someArg
            inheritedArg
            untouchedArg
            filtersKeys
            filtersAnd
            nestedAnd
          }
        }
      `,
    });

    expectSingleResult(response).toEqual({
      getAnotherObject: {
        keys: ['filters', 'inheritedArg', 'someArg', 'untouchedArg'],
        someArg: 'a',
        inheritedArg: 'b',
        untouchedArg: 'c',
        filtersKeys: ['$and', 'nested'],
        filtersAnd: 'd',
        nestedAnd: 'e',
      },
    });
  });

  it('should map nested input types of a named argument as well', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          getByFilters(filters: { and: "d", nested: [{ and: "e" }] }) {
            keys
            filtersAnd
            nestedAnd
          }
        }
      `,
    });

    expectSingleResult(response).toEqual({
      getByFilters: {
        keys: ['$and', 'nested'],
        filtersAnd: 'd',
        nestedAnd: 'e',
      },
    });
  });

  it('should map the args of a field resolver too', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          getAnotherObject(some_arg: "a") {
            resolvedField(some_arg: "b")
          }
        }
      `,
    });

    expectSingleResult(response).toEqual({
      getAnotherObject: { resolvedField: 'b' },
    });
  });

  it('should map every scalar kind, falsy values and nulls included', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          scalars(
            int_arg: 0
            float_arg: 1.5
            bool_arg: false
            id_arg: "7"
            enum_arg: B
            list_arg: [1, 2]
            null_arg: null
          )
        }
      `,
    });

    expectSingleResult(response).toEqual({
      scalars: JSON.stringify({
        boolArg: false,
        enumArg: 'B',
        floatArg: 1.5,
        idArg: '7',
        intArg: 0,
        listArg: [1, 2],
        nullArg: null,
      }),
    });
  });

  it('should run before the user pipes, so validation sees the class properties', async () => {
    const valid = await apolloClient.executeOperation({
      query: gql`
        {
          validate(input: { and: "ok" }) {
            keys
            filtersAnd
          }
        }
      `,
    });
    expectSingleResult(valid).toEqual({
      validate: { keys: ['$and'], filtersAnd: 'ok' },
    });

    const invalid: any = await apolloClient.executeOperation({
      query: gql`
        {
          validate(input: { and: "x" }) {
            filtersAnd
          }
        }
      `,
    });
    expect(
      invalid.body.singleResult.errors[0].extensions.originalError.message,
    ).toEqual(['$and must be longer than or equal to 2 characters']);
  });

  it('should not let a chained rename overwrite another property', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          chained(input: { a: "one", b: "two" })
        }
      `,
    });

    // "a" belongs to property "b" and "b" belongs to property "c"
    expectSingleResult(response).toEqual({
      chained: JSON.stringify({ b: 'one', c: 'two' }),
    });
  });

  it('should map a list-typed named argument', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          listOfFilters(filters: [{ and: "d" }, { and: "e" }])
        }
      `,
    });

    expectSingleResult(response).toEqual({
      listOfFilters: JSON.stringify([['$and'], ['$and']]),
    });
  });
});

@Resolver(() => Probe)
class GlobalPipeResolver {
  @Query(() => Probe)
  validateGlobally(@Args('input') input: ValidatedInput): Probe {
    return { json: JSON.stringify({ keys: Object.keys(input).sort() }) };
  }

  @Query(() => Probe)
  keepInstance(@Args('input') input: NestingInput): Probe {
    return {
      json: JSON.stringify({
        isInstance: input instanceof NestingInput,
        and: input.filters?.$and,
      }),
    };
  }
}

describe('Renamed args behind a globally registered pipe', () => {
  let app: INestApplication;
  let apolloClient: ApolloServer;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
        }),
      ],
      providers: [GlobalPipeResolver],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    apolloClient =
      app.get<GraphQLModule<ApolloDriver>>(GraphQLModule).graphQlAdapter
        ?.instance;
  });

  afterEach(async () => {
    await app.close();
  });

  it('should map the args before a global ValidationPipe validates them', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          validateGlobally(input: { and: "ok" }) {
            json
          }
        }
      `,
    });

    expectSingleResult(response).toEqual({
      validateGlobally: { json: JSON.stringify({ keys: ['$and'] }) },
    });
  });

  it('should keep the instance produced by a transforming global pipe', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          keepInstance(input: { filters: { and: "d" } }) {
            json
          }
        }
      `,
    });

    expectSingleResult(response).toEqual({
      keepInstance: { json: JSON.stringify({ isInstance: true, and: 'd' }) },
    });
  });
});
