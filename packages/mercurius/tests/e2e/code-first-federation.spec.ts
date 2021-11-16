import { INestApplication } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { ApplicationModule } from '../code-first-federation/app.module';

describe('Code-first - Federation', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication(new FastifyAdapter());
    await app.init();
  });

  it(`should return query result`, async () => {
    const fastifyInstance = app.getHttpAdapter().getInstance();
    await fastifyInstance.ready();

    const response = await fastifyInstance.graphql(`
        {
          _service {
            sdl
          }
        }
      `);
    expect(response.data).toEqual({
      _service: {
        sdl: `interface IRecipe {
  id: ID!
  title: String!
  externalField: String! @external
}

type Post @key(fields: \"id\") {
  id: ID!
  title: String!
  authorId: Int!
}

type User @extends @key(fields: \"id\") {
  id: ID! @external
  posts: [Post!]!
}

type Recipe implements IRecipe {
  id: ID!
  title: String!
  externalField: String! @external
  description: String!
}

type Query {
  findPost(id: Float!): Post!
  getPosts: [Post!]!
  search: [FederationSearchResultUnion!]! @deprecated(reason: \"test\")
  recipe: IRecipe!
}

\"\"\"Search result description\"\"\"
union FederationSearchResultUnion = Post | User
`,
      },
    });
  });

  it.skip('should return the search result', async () => {
    const fastifyInstance = app.getHttpAdapter().getInstance();
    await fastifyInstance.ready();

    const response = await fastifyInstance.graphql(`
        {
          search {
            ... on Post {
              title
            }
            ... on User {
              id
            }
            __typename
          }
        }
      `);
    expect(response.data).toEqual({
      search: [
        {
          id: '1',
          __typename: 'User',
        },
        {
          title: 'lorem ipsum',
          __typename: 'Post',
        },
      ],
    });
  });

  it.skip(`should return query result`, async () => {
    const fastifyInstance = app.getHttpAdapter().getInstance();
    await fastifyInstance.ready();

    const response = await fastifyInstance.graphql(`
        {
          recipe {
            id
            title
            ... on Recipe {
              description
            }
          }
        }
      `);
    expect(response.data).toEqual({
      recipe: {
        id: '1',
        title: 'Recipe',
        description: 'Interface description',
      },
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
