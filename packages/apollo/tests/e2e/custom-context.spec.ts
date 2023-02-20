import { INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { CustomContextModule } from '../graphql/custom-context/custom-context.module';
import { FastifyAdapter } from '@nestjs/platform-fastify';

describe('GraphQL (custom context)', () => {
  let app: INestApplication;

  describe.each([
    ['Express', new ExpressAdapter()],
    ['Fastify', new FastifyAdapter()],
  ])('Custom context with %s', (_, adapter) => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [CustomContextModule],
      }).compile();

      app = module.createNestApplication(adapter);
      await app.init();

      const instance = app.getHttpAdapter().getInstance();
      if ('ready' in instance && typeof instance.ready === 'function') {
        await instance.ready();
      }
    });

    it('should return query result', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `
          {
            fooFromContext
          }
          `,
        })
        .expect(200, {
          data: {
            fooFromContext: 'bar',
          },
        });
    });

    afterEach(async () => {
      await app.close();
    });
  });
});
