import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { ApplicationModule } from '../code-first/app.module';

describe('Code-first', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should return the categories result', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: `
        {
          categories {
            name
            description
            tags
          }
        }`,
      })
      .expect(200, {
        data: {
          categories: [
            {
              name: 'Category #1',
              description: 'default value',
              tags: [],
            },
          ],
        },
      });
  });

  it('should return the search result', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: `
        {
          search {
            ... on Recipe {
              title
            }
            ... on Ingredient {
              name
            }
          }
        }`,
      })
      .expect(200, {
        data: {
          search: [
            {
              title: 'recipe',
            },
            {
              name: 'test',
            },
          ],
        },
      });
  });

  it(`should return query result`, () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: `
        {
          recipes {
            id,
            ingredients {
              name
            },
            rating,
            interfaceResolver,
            averageRating
          }
        }`,
      })
      .expect(200, {
        data: {
          recipes: [
            {
              id: '1',
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
        },
      });
  });

  it(`should return query result`, () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: `
        {
          recipes {
            id,
            ingredients {
              name
            },
            rating,
            averageRating
          }
        }`,
      })
      .expect(200, {
        data: {
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
        },
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
