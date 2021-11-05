import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { printSchema, GraphQLSchema } from 'graphql';
import { SortSchemaModule } from '../graphql/sort-schema.module';
import { GRAPHQL_SDL_FILE_HEADER } from '../../lib/graphql.constants';
import { GraphQLSchemaHost } from '../../lib';

describe('GraphQL sort schema', () => {
  let app: INestApplication;
  let schema: GraphQLSchema;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [SortSchemaModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    const graphQLSchemaHost = app.get<GraphQLSchemaHost>(GraphQLSchemaHost);
    schema = graphQLSchemaHost.schema;
  });

  it('should match schema snapshot', () => {
    expect(GRAPHQL_SDL_FILE_HEADER + printSchema(schema)).toEqual(
      expectedSchema,
    );
  });

  afterEach(async () => {
    await app.close();
  });
});

const expectedSchema = `# ------------------------------------------------------
# THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
# ------------------------------------------------------

type Cat {
  age: Int
  color: String
  id: Int
  name: String
  weight: Int
}

type Mutation {
  createCat(name: String): Cat
}

type Query {
  cat(id: ID!): Cat
  getCats: [Cat]
}

type Subscription {
  catCreated: Cat
}
`;
