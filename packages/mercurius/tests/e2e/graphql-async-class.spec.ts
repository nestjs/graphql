import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AsyncClassApplicationModule } from '../graphql/async-options-class.module';
import { BASE_URL, PLUGIN_RESPONSE } from '../mock-plugin/contants';

describe('GraphQL (async class)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await NestFactory.create(
      AsyncClassApplicationModule,
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

  describe('plugins test', () => {
    it('should get the plugin', () => {
      return request(app.getHttpServer())
        .get(BASE_URL)
        .expect(200, PLUGIN_RESPONSE);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
