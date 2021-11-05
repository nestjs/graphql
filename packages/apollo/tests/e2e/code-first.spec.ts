import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql-experimental';
import { Test } from '@nestjs/testing';
import { ApolloServerBase } from 'apollo-server-core';
import { gql } from 'graphql-tag';
import { ApplicationModule } from '../code-first/app.module';

describe('Code-first', () => {
  let app: INestApplication;
  let apolloClient: ApolloServerBase;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    const graphqlModule = app.get(GraphQLModule);
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
    expect(response.data).toEqual({
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
    expect(response.data).toEqual({
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
            interfaceResolver
            averageRating
          }
        }
      `,
    });
    expect(response.data).toEqual({
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
          }
        }
      `,
    });
    expect(response.data).toEqual({
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
        },
      ],
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
