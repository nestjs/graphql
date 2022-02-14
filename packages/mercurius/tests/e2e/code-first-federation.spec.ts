import { INestApplication, Type } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule as GatewayModule } from '../code-first-federation/gateway/gateway.module';
import { AppModule as PostsModule } from '../code-first-federation/posts-service/federation-posts.module';
import { AppModule as UsersModule } from '../code-first-federation/users-service/federation-users.module';
import { AppModule as RecipesModule } from '../code-first-federation/recipes-service/federation-recipes.module';

async function createService(Module: Type<any>, port: number) {
  const module = await Test.createTestingModule({
    imports: [Module],
  }).compile();

  const app = module.createNestApplication(new FastifyAdapter());
  await app.listen(port);

  return app;
}

describe('Code-first - Federation', () => {
  let recipesApp: INestApplication;
  let postsApp: INestApplication;
  let usersApp: INestApplication;
  let gatewayApp: INestApplication;

  beforeEach(async () => {
    recipesApp = await createService(RecipesModule, 3011);
    postsApp = await createService(PostsModule, 3012);
    usersApp = await createService(UsersModule, 3013);

    const gatewayModule = await Test.createTestingModule({
      imports: [GatewayModule],
    }).compile();

    gatewayApp = gatewayModule.createNestApplication(new FastifyAdapter());
    await gatewayApp.init();

    await gatewayApp.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await gatewayApp.close();
    await recipesApp.close();
    await postsApp.close();
    await usersApp.close();
  });

  it('should return _service query result', async () => {
    const fastifyInstance = postsApp.getHttpAdapter().getInstance();
    await fastifyInstance.ready();

    const response = await fastifyInstance.graphql(`
      query {
        _service {
          sdl
        }
      }
    `);

    expect(response.data).toEqual({
      _service: {
        sdl: `type Post @key(fields: "id") {
  id: ID!
  title: String!
  authorId: Int!
}

type Query @extends {
  findPost(id: Float!): Post!
  getPosts: [Post!]!
  search: [FederationSearchResultUnion!]! @deprecated(reason: "test")
}

"""Search result description"""
union FederationSearchResultUnion = Post | User

type User @extends @key(fields: "id") {
  id: ID! @external
  posts: [Post!]!
}
`
      }
    });
  });

  it('should return recipes query result from gateway', async () => {
    return request(gatewayApp.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: `
        {
          recipe {
            id
            title
            ...on Recipe {
              description
            }
          }
        }`,
      })
      .expect(200, {
        data: {
          recipe: {
            id: '1',
            title: 'Recipe',
            description: 'Interface description',
          },
        },
      });
  });

  it('should return users query result from gateway', async () => {
    return request(gatewayApp.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: { id: 1 },
        query: `
        query User($id: Float!) {
          findUser(id: $id) {
            id,
            name
          }
        }`,
      })
      .expect(200, {
        data: {
          findUser: {
            id: '1',
            name: 'foo',
          },
        },
      });
  });

  it('should return posts query result from gateway', async () => {
    return request(gatewayApp.getHttpServer())
    .post('/graphql')
    .send({
      operationName: null,
      variables: {},
      query: `
        {
          search {
            __typename
            ...on Post {
              id
              title
              authorId
            }
            ...on User {
              id
            }
          }
        }`,
    })
    .expect(200, {
      data: {
        search: [
          { __typename: 'User', id: '1' },
          { __typename: 'Post', id: '2', title: 'lorem ipsum', authorId: 1 },
        ],
      },
    });
  });
})

// describe.skip('Code-first - Federation', () => {
//   let app: INestApplication;
//
//   beforeEach(async () => {
//     const module = await Test.createTestingModule({
//       // imports: [ApplicationModule],
//     }).compile();
//
//     app = module.createNestApplication(new FastifyAdapter());
//     await app.init();
//   });
//
//   it.skip(`should return query result`, async () => {
//     const fastifyInstance = app.getHttpAdapter().getInstance();
//     await fastifyInstance.ready();
//
//     const response = await fastifyInstance.graphql(`
//         {
//           _service {
//             sdl
//           }
//         }
//       `);
//     expect(response.data).toEqual({
//       _service: {
//         sdl: `interface IRecipe {
//   id: ID!
//   title: String!
//   externalField: String! @external
// }
//
// type Post @key(fields: \"id\") {
//   id: ID!
//   title: String!
//   authorId: Int!
// }
//
// type User @extends @key(fields: \"id\") {
//   id: ID! @external
//   posts: [Post!]!
// }
//
// type Recipe implements IRecipe {
//   id: ID!
//   title: String!
//   externalField: String! @external
//   description: String!
// }
//
// type Query {
//   findPost(id: Float!): Post!
//   getPosts: [Post!]!
//   search: [FederationSearchResultUnion!]! @deprecated(reason: \"test\")
//   recipe: IRecipe!
// }
//
// \"\"\"Search result description\"\"\"
// union FederationSearchResultUnion = Post | User
// `,
//       },
//     });
//   });
//
//   it('should return the search result', async () => {
//     const fastifyInstance = app.getHttpAdapter().getInstance();
//     await fastifyInstance.ready();
//
//     const response = await fastifyInstance.graphql(`
//         {
//           search {
//             ... on Post {
//               title
//             }
//             ... on User {
//               id
//             }
//             __typename
//           }
//         }
//       `);
//     expect(response.data).toEqual({
//       search: [
//         {
//           id: '1',
//           __typename: 'User',
//         },
//         {
//           title: 'lorem ipsum',
//           __typename: 'Post',
//         },
//       ],
//     });
//   });
//
//   it(`should return query result`, async () => {
//     const fastifyInstance = app.getHttpAdapter().getInstance();
//     await fastifyInstance.ready();
//
//     const response = await fastifyInstance.graphql(`
//         {
//           recipe {
//             id
//             title
//             ... on Recipe {
//               description
//             }
//           }
//         }
//       `);
//     expect(response.data).toEqual({
//       recipe: {
//         id: '1',
//         title: 'Recipe',
//         description: 'Interface description',
//       },
//     });
//   });
//
//   afterEach(async () => {
//     await app.close();
//   });
// });
