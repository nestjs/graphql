import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { GlobalPrefixModule } from '../graphql/global-prefix.module';

describe('GraphQL (global prefix)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [GlobalPrefixModule],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('/api/v1');
    await app.init();
  });

  it('should return query result', () => {
    return request(app.getHttpServer())
      .post('/api/v1/graphql')
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

  afterEach(async () => {
    await app.close();
  });
});
