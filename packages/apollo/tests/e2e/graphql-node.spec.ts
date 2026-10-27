import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ApplicationModule } from '../graphql/app.module.js';
import { NodeAdapter } from '@nestjs/platform-node';

describe('GraphQL with the Node adapter', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication(new NodeAdapter());
    await app.init();
  });

  it(`should return query result`, () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: `
        {
          getCats {
            id,
            color,
            weight
          }
        }`,
      })
      .expect(200, {
        data: {
          getCats: [
            {
              id: 1,
              color: 'black',
              weight: 5,
            },
          ],
        },
      });
  });

  it(`should render GraphiQL Playground`, async () => {
    const res = await request(app.getHttpServer())
      .get('/graphql')
      .set('Accept', 'text/html')
      .expect(200);
    expect(res.text).toContain('<title>GraphiQL</title>');
  });

  afterEach(async () => {
    await app.close();
  });
});
