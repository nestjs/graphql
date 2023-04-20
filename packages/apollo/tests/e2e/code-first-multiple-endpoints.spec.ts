import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { ApolloServer, GraphQLResponse } from '@apollo/server';
import { gql } from 'graphql-tag';
import { IntrospectionSchema, getIntrospectionQuery } from 'graphql';
import { ApolloDriver } from '../../lib';
import { ApplicationModule } from '../code-first-multiple-endpoints/app.module';
import { expectSingleResult } from '../utils/assertion-utils';

async function getIntrospectionSchema(
  apolloClient: ApolloServer,
): Promise<IntrospectionSchema> {
  const response = await apolloClient.executeOperation({
    query: getIntrospectionQuery(),
  });
  return (response.body as any).singleResult.data.__schema;
}

describe('Code-first - multiple endpoints', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  describe('public endpoint', () => {
    let apolloClient: ApolloServer;

    beforeAll(() => {
      const graphqlModules = app.get<GraphQLModule<ApolloDriver>>(
        GraphQLModule,
        {
          each: true,
        },
      );
      apolloClient = graphqlModules.find(
        ({ options }) => options.path === '/graphql',
      ).graphQlAdapter?.instance;
    });

    it('should not have not have "BookRecord" and "AuthorRecord" types in schema', async () => {
      const { types } = await getIntrospectionSchema(apolloClient);
      expect(
        types.some(
          ({ name }) => name === 'BookRecord' || name === 'AuthorRecord',
        ),
      ).toBe(false);
    });

    it('should return books result', async () => {
      const response = await apolloClient.executeOperation({
        query: gql`
          {
            books {
              id
              title
              author {
                id
                name
              }
            }
          }
        `,
      });
      expectSingleResult(response).toEqual({
        books: expect.arrayContaining([
          {
            id: expect.stringMatching(/^B[0-9]{3}$/),
            title: expect.any(String),
            author: {
              id: expect.stringMatching(/^A[0-9]{3}$/),
              name: expect.any(String),
            },
          },
        ]),
      });
    });

    it('should return authors result', async () => {
      const response = await apolloClient.executeOperation({
        query: gql`
          {
            authors {
              id
              name
              books {
                id
                title
              }
            }
          }
        `,
      });
      expectSingleResult(response).toEqual({
        authors: expect.arrayContaining([
          {
            id: expect.stringMatching(/^A[0-9]{3}$/),
            name: expect.any(String),
            books: expect.arrayContaining([
              {
                title: expect.any(String),
                id: expect.stringMatching(/^B[0-9]{3}$/),
              },
            ]),
          },
        ]),
      });
    });
  });

  describe('private endpoint', () => {
    let apolloClient: ApolloServer;

    beforeAll(() => {
      const graphqlModules = app.get<GraphQLModule<ApolloDriver>>(
        GraphQLModule,
        {
          each: true,
        },
      );
      apolloClient = graphqlModules.find(
        ({ options }) => options.path === '/graphql/admin',
      ).graphQlAdapter?.instance;
    });

    it('should not have not have "Book" and "Author" types in schema', async () => {
      const { types } = await getIntrospectionSchema(apolloClient);
      expect(
        types.some(({ name }) => name === 'Book' || name === 'Author'),
      ).toBe(false);
    });

    it('should return books record result', async () => {
      const response = await apolloClient.executeOperation({
        query: gql`
          {
            books {
              id
              title
              unitsSold
              author {
                id
                name
                penName
                contracted
              }
            }
          }
        `,
      });
      expectSingleResult(response).toEqual({
        books: expect.arrayContaining([
          {
            id: expect.stringMatching(/^B[0-9]{3}$/),
            title: expect.any(String),
            unitsSold: expect.any(Number),
            author: {
              id: expect.stringMatching(/^A[0-9]{3}$/),
              name: expect.any(String),
              penName: expect.any(String),
              contracted: expect.any(Boolean),
            },
          },
        ]),
      });
    });

    it('should return author records result', async () => {
      const response = await apolloClient.executeOperation({
        query: gql`
          {
            authors {
              id
              name
              penName
              contracted
              books {
                id
                title
                unitsSold
              }
            }
          }
        `,
      });
      expectSingleResult(response).toEqual({
        authors: expect.arrayContaining([
          {
            id: expect.stringMatching(/^A[0-9]{3}$/),
            name: expect.any(String),
            penName: expect.any(String),
            contracted: expect.any(Boolean),
            books: expect.arrayContaining([
              {
                title: expect.any(String),
                id: expect.stringMatching(/^B[0-9]{3}$/),
                unitsSold: expect.any(Number),
              },
            ]),
          },
        ]),
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
