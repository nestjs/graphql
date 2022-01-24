import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AsyncExistingApplicationModule } from '../graphql/async-options-existing.module';

describe('GraphQL (async existing)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await NestFactory.create(
      AsyncExistingApplicationModule,
      new FastifyAdapter(),
      {
        logger: false,
      },
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  it(`should return query result`, () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: '{\n  getCats {\n    id\n  }\n}\n',
      })
      .expect(200, {
        data: {
          getCats: [
            {
              id: 1,
            },
          ],
        },
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
