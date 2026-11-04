import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled';
import assert from 'assert';
import { INestApplication, Module } from '@nestjs/common';
import { Args, GraphQLModule, Int, Query, Resolver } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { GraphQLError, GraphQLScalarType, Kind } from 'graphql';
import { gql } from 'graphql-tag';
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '../../lib/index.js';

function parseDay(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new GraphQLError(`Day cannot represent ${JSON.stringify(value)}`);
  }
  return new Date(value);
}

const DayScalar = new GraphQLScalarType({
  name: 'Day',
  serialize: (value: Date) => value.toISOString().slice(0, 10),
  parseValue: parseDay,
  parseLiteral: (ast) => parseDay(ast.kind === Kind.STRING ? ast.value : null),
});

function parsePositiveInt(value: unknown) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new GraphQLError(
      `PositiveInt cannot represent ${JSON.stringify(value)}`,
    );
  }
  return value;
}

const PositiveIntScalar = new GraphQLScalarType({
  name: 'PositiveInt',
  serialize: parsePositiveInt,
  parseValue: parsePositiveInt,
  parseLiteral: (ast) =>
    parsePositiveInt(ast.kind === Kind.INT ? Number(ast.value) : null),
});

@Resolver()
class ScalarsResolver {
  @Query(() => Date)
  nextDay(@Args('day') day: Date): Date {
    return new Date(day.getTime() + 24 * 60 * 60 * 1000);
  }

  @Query(() => Int)
  double(
    @Args('amount', { type: () => PositiveIntScalar }) amount: number,
  ): number {
    return amount * 2;
  }

  @Query(() => PositiveIntScalar)
  negative(): number {
    return -5;
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: true,
      buildSchemaOptions: { scalarsMap: [{ type: Date, scalar: DayScalar }] },
      includeStacktraceInErrorResponses: false,
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    }),
  ],
  providers: [ScalarsResolver],
})
class CustomScalarsFederationModule {}

describe('Federation - custom scalars of the code-first schema', () => {
  let app: INestApplication;
  let apolloClient: ApolloServer;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CustomScalarsFederationModule],
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
    return response.body.singleResult;
  }

  it('should parse and serialize values through the scalar from "scalarsMap"', async () => {
    const result = await execute(`{ nextDay(day: "2020-01-31") }`);
    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({ nextDay: '2020-02-01' });
  });

  it('should reject values the scalar from "scalarsMap" does not accept', async () => {
    const result = await execute(`{ nextDay(day: "1") }`);
    expect(result.errors?.[0].message).toBe('Day cannot represent "1"');
  });

  it('should reject values a directly referenced scalar does not accept', async () => {
    const result = await execute(`{ double(amount: -1000) }`);
    expect(result.errors?.[0].message).toBe(
      'PositiveInt cannot represent -1000',
    );
  });

  it('should serialize values through a directly referenced scalar', async () => {
    const result = await execute(`{ negative }`);
    expect(result.errors?.[0].message).toBe('PositiveInt cannot represent -5');
  });
});
