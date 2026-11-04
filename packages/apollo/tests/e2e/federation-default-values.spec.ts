import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled';
import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import assert from 'assert';
import { INestApplication, Module } from '@nestjs/common';
import {
  Args,
  Directive,
  Field,
  GraphQLISODateTime,
  GraphQLModule,
  InputType,
  ObjectType,
  Query,
  registerEnumType,
  Resolver,
} from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import {
  DirectiveLocation,
  GraphQLDirective,
  GraphQLEnumType,
  GraphQLSchema,
} from 'graphql';
import { gql } from 'graphql-tag';
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '../../lib/index.js';

enum Role {
  GUEST = 0,
  USER = 1,
  ADMIN = 2,
}
registerEnumType(Role, { name: 'Role' });

const RankType = new GraphQLEnumType({
  name: 'Rank',
  values: {
    GUEST: { value: Role.GUEST },
    USER: { value: Role.USER },
    ADMIN: { value: Role.ADMIN },
  },
});

// directive @auth(requires: Rank = ADMIN, until: DateTime = "1970-...") on FIELD_DEFINITION
const authDirective = new GraphQLDirective({
  name: 'auth',
  locations: [DirectiveLocation.FIELD_DEFINITION],
  args: {
    requires: { type: RankType, defaultValue: Role.ADMIN },
    until: { type: GraphQLISODateTime, defaultValue: new Date(0) },
  },
});

const authDirectiveArgs: Record<string, Record<string, unknown>> = {};

function authDirectiveTransformer(schema: GraphQLSchema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig, fieldName) => {
      const auth = getDirective(schema, fieldConfig, 'auth')?.[0];
      if (auth) {
        authDirectiveArgs[fieldName] = auth;
      }
      return fieldConfig;
    },
  });
}

@InputType()
class EmployeeFilter {
  @Field(() => Role, { defaultValue: Role.ADMIN })
  role: Role;

  @Field(() => GraphQLISODateTime, { defaultValue: new Date(0) })
  since: Date;
}

@ObjectType()
class Employee {
  @Field()
  name: string;

  @Directive('@auth')
  @Field()
  salary: number;

  @Directive('@auth(requires: USER)')
  @Field()
  bonus: number;
}

@Resolver(() => Employee)
class EmployeeResolver {
  @Query(() => Employee)
  employee(): Employee {
    return { name: 'Ada', salary: 1, bonus: 2 };
  }

  @Query(() => String)
  argDefaults(
    @Args({ name: 'role', type: () => Role, defaultValue: Role.ADMIN })
    role: Role,
    @Args({
      name: 'since',
      type: () => GraphQLISODateTime,
      defaultValue: new Date(0),
    })
    since: Date,
  ): string {
    return formatDefaults(role, since);
  }

  @Query(() => String)
  inputDefaults(@Args('filter') filter: EmployeeFilter): string {
    return formatDefaults(filter.role, filter.since);
  }
}

function formatDefaults(role: Role, since: Date) {
  return `${JSON.stringify(role)}/${
    since instanceof Date ? since.toISOString() : typeof since
  }`;
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: { federation: 2 },
      buildSchemaOptions: { directives: [authDirective] },
      transformSchema: authDirectiveTransformer,
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    }),
  ],
  providers: [EmployeeResolver],
})
class DefaultValuesFederationModule {}

describe('Federation - default values of the code-first schema', () => {
  let app: INestApplication;
  let apolloClient: ApolloServer;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DefaultValuesFederationModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const graphqlModule =
      app.get<GraphQLModule<ApolloFederationDriver>>(GraphQLModule);
    apolloClient = graphqlModule.graphQlAdapter?.instance;
  });

  afterAll(async () => {
    await app.close();
  });

  async function execute(query: string) {
    const response = await apolloClient.executeOperation({ query: gql(query) });
    assert(response.body.kind === 'single');
    expect(response.body.singleResult.errors).toBeUndefined();
    return response.body.singleResult.data;
  }

  it('should keep the declared defaults of directive arguments', () => {
    expect(authDirectiveArgs.salary.requires).toBe(Role.ADMIN);
    expect(authDirectiveArgs.salary.until).toEqual(new Date(0));
    expect(authDirectiveArgs.bonus.requires).toBe(Role.USER);
  });

  it('should keep the declared defaults of field arguments', async () => {
    const data = await execute(`{ argDefaults }`);
    expect(data).toEqual({ argDefaults: '2/1970-01-01T00:00:00.000Z' });
  });

  it('should keep the declared defaults of input fields', async () => {
    const data = await execute(`{ inputDefaults(filter: {}) }`);
    expect(data).toEqual({ inputDefaults: '2/1970-01-01T00:00:00.000Z' });
  });

  it('should expose the defaults through introspection', async () => {
    const data = await execute(`
      {
        __schema {
          directives {
            name
            args {
              name
              defaultValue
            }
          }
        }
      }
    `);
    const { directives } = data.__schema as {
      directives: { name: string; args: { name: string; defaultValue }[] }[];
    };
    expect(directives.find(({ name }) => name === 'auth')?.args).toEqual([
      { name: 'requires', defaultValue: 'ADMIN' },
      { name: 'until', defaultValue: '"1970-01-01T00:00:00.000Z"' },
    ]);
  });
});
