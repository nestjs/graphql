import { INestApplication } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { ApplicationModule } from '../code-first/app.module';

describe('Code-first', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication(new FastifyAdapter());
    await app.init();
  });

  it('should return the categories result', async () => {
    const fastifyInstance = app.getHttpAdapter().getInstance();
    await fastifyInstance.ready();

    const response = await fastifyInstance.graphql(`
        {
          categories {
            name
            description
            tags
          }
        }
      `);
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
    const fastifyInstance = app.getHttpAdapter().getInstance();
    await fastifyInstance.ready();

    const response = await fastifyInstance.graphql(`
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
      `);
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
    const fastifyInstance = app.getHttpAdapter().getInstance();
    await fastifyInstance.ready();

    const response = await fastifyInstance.graphql(`
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
      `);
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
    const fastifyInstance = app.getHttpAdapter().getInstance();
    await fastifyInstance.ready();

    const response = await fastifyInstance.graphql(`
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
      `);
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
