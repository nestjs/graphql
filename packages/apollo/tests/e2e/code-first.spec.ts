import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { ApolloServer } from '@apollo/server';
import { gql } from 'graphql-tag';
import { ApolloDriver } from '../../lib';
import { ApplicationModule } from '../code-first/app.module';
import { expectSingleResult } from '../utils/assertion-utils';

describe('Code-first', () => {
  let app: INestApplication;
  let apolloClient: ApolloServer;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    const graphqlModule = app.get<GraphQLModule<ApolloDriver>>(GraphQLModule);
    apolloClient = graphqlModule.graphQlAdapter?.instance;
  });

  it('should return the categories result', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          categories {
            name
            description
            tags
          }
        }
      `,
    });
    expectSingleResult(response).toEqual({
      categories: [
        {
          name: 'Category #1',
          description: 'default value',
          tags: [],
        },
      ],
    });
  });

  it('should return the search result', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          search {
            ... on Recipe {
              title
            }
            ... on Ingredient {
              name
            }
          }
        }
      `,
    });
    expectSingleResult(response).toEqual({
      search: [
        {
          title: 'recipe',
        },
        {
          name: 'test',
        },
      ],
    });
  });

  it(`should return query result`, async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          recipes {
            id
            description
            ingredients {
              name
            }
            rating
            tips1
            tips2
            interfaceResolver
            averageRating
          }
        }
      `,
    });
    expectSingleResult(response).toEqual({
      recipes: [
        {
          id: '1',
          description: 'Description: Calzone',
          ingredients: [
            {
              name: 'cherry',
            },
          ],
          rating: 10,
          tips1: 'use oil sparingly',
          tips2: 'add salt gradually',
          interfaceResolver: true,
          averageRating: 0.5,
        },
        {
          id: '2',
          description: 'Placeholder',
          ingredients: [
            {
              name: 'cherry',
            },
          ],
          rating: 10,
          tips1: 'use oil sparingly',
          tips2: 'add salt gradually',
          interfaceResolver: true,
          averageRating: 0.5,
        },
      ],
    });
  });

  it(`should return query result`, async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          recipes {
            id
            ingredients {
              name
            }
            rating
            averageRating
            tips1
            tips2
          }
        }
      `,
    });
    expectSingleResult(response).toEqual({
      recipes: [
        {
          id: '1',
          ingredients: [
            {
              name: 'cherry',
            },
          ],
          rating: 10,
          averageRating: 0.5,
          tips1: 'use oil sparingly',
          tips2: 'add salt gradually',
        },
        {
          id: '2',
          ingredients: [
            {
              name: 'cherry',
            },
          ],
          rating: 10,
          averageRating: 0.5,
          tips1: 'use oil sparingly',
          tips2: 'add salt gradually',
        },
      ],
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
