import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { gql } from 'apollo-server-express';
import { ApolloServerTestClient } from 'apollo-server-testing';
import { ApplicationModule } from '../code-first/app.module';
import { createTestClient } from '../utils/create-test-client';

describe('Code-first', () => {
  let app: INestApplication;
  let apolloClient: ApolloServerTestClient;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    apolloClient = createTestClient(module);
  });

  it('should return the categories result', async () => {
    const response = await apolloClient.query({
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
    const response = await apolloClient.query({
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
    const response = await apolloClient.query({
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
    const response = await apolloClient.query({
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
