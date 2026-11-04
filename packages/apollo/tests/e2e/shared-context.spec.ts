import { INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { createClient } from 'graphql-ws';
import request from 'supertest';
import ws from 'ws';
import { SharedContextModule } from '../graphql/shared-context/shared-context.module.js';
import { SharedContextResolver } from '../graphql/shared-context/shared-context.resolver.js';

describe('GraphQL (context object shared by all requests)', () => {
  let app: INestApplication;
  let sharedContext: Record<string, any>;

  const queryRequestId = (id: string) =>
    request(app.getHttpServer())
      .post('/graphql')
      .set('x-request-id', id)
      .send({ query: '{ requestId }' });

  const expectDistinctContexts = (count: number) => {
    const contexts = SharedContextResolver.CONTEXTS;
    expect(contexts).toHaveLength(count);
    expect(new Set(contexts).size).toBe(count);
    for (const context of contexts) {
      expect(context).not.toBe(sharedContext);
      expect(context.tenant).toBe('static');
    }
  };

  describe.each([
    ['Express', () => new ExpressAdapter()],
    ['Fastify', () => new FastifyAdapter()],
  ])('with %s', (_, createAdapter) => {
    const bootstrap = async (context: unknown) => {
      const module = await Test.createTestingModule({
        imports: [SharedContextModule.forRoot(context)],
      }).compile();

      app = module.createNestApplication(createAdapter());
      await app.init();

      const instance = app.getHttpAdapter().getInstance();
      if ('ready' in instance && typeof instance.ready === 'function') {
        await instance.ready();
      }
    };

    beforeEach(() => {
      sharedContext = { tenant: 'static' };
      SharedContextResolver.CONTEXTS = [];
      SharedContextResolver.BARRIER = undefined;
    });

    describe.each([
      ['an object', () => sharedContext],
      ['a function returning the same object', () => () => sharedContext],
    ])('when "context" is %s', (_, createContextOption) => {
      beforeEach(() => bootstrap(createContextOption()));

      it('should give each sequential request its own context and "req"', async () => {
        for (const id of ['first', 'second', 'third']) {
          await queryRequestId(id).expect(200, { data: { requestId: id } });
        }

        expectDistinctContexts(3);
        expect(Reflect.ownKeys(sharedContext)).toEqual(['tenant']);
      });

      it('should give each concurrent request its own context and "req"', async () => {
        const ids = ['a', 'b', 'c', 'd', 'e'];
        let release!: () => void;
        SharedContextResolver.BARRIER = new Promise(
          (resolve) => (release = resolve),
        );

        const responses = Promise.all(ids.map((id) => queryRequestId(id)));
        try {
          // Every request has its context created before any of them reads it
          await vi.waitFor(() =>
            expect(SharedContextResolver.CONTEXTS).toHaveLength(ids.length),
          );
        } finally {
          release();
        }

        expect((await responses).map((res) => res.body)).toEqual(
          ids.map((id) => ({ data: { requestId: id } })),
        );
        expectDistinctContexts(ids.length);
        expect(Reflect.ownKeys(sharedContext)).toEqual(['tenant']);
      });
    });

    describe.each([
      ['an object', () => sharedContext],
      ['a function returning the same object', () => () => sharedContext],
    ])('when "context" is %s with its own "req"', (_, createContextOption) => {
      it('should keep that "req" while still giving each request its own context', async () => {
        sharedContext.req = { headers: { 'x-request-id': 'static' } };
        await bootstrap(createContextOption());

        for (const id of ['first', 'second']) {
          await queryRequestId(id).expect(200, {
            data: { requestId: 'static' },
          });
        }

        expectDistinctContexts(2);
        expect(Reflect.ownKeys(sharedContext)).toEqual(['tenant', 'req']);
      });
    });

    afterEach(async () => {
      await app.close();
    });
  });

  describe('over graphql-ws', () => {
    // Unlike Apollo Server, graphql-ws uses the context as it is returned
    const queryRequestIdOverWebSocket = async () => {
      const client = createClient({
        url: `ws://localhost:${app.getHttpServer().address().port}/graphql`,
        webSocketImpl: ws,
        retryAttempts: 0,
      });
      try {
        for await (const result of client.iterate({ query: '{ requestId }' })) {
          return result;
        }
      } finally {
        await client.dispose();
      }
    };

    beforeEach(() => {
      sharedContext = {
        tenant: 'static',
        req: { headers: { 'x-request-id': 'static' } },
      };
      SharedContextResolver.CONTEXTS = [];
      SharedContextResolver.BARRIER = undefined;
    });

    describe.each([
      ['an object', () => sharedContext],
      ['a function returning the same object', () => () => sharedContext],
    ])('when "context" is %s with its own "req"', (_, createContextOption) => {
      beforeEach(async () => {
        const module = await Test.createTestingModule({
          imports: [
            SharedContextModule.forRoot(createContextOption(), {
              subscriptions: { 'graphql-ws': true },
            }),
          ],
        }).compile();

        app = module.createNestApplication();
        await app.listen(0);
      });

      it('should give each operation its own context', async () => {
        for (let i = 0; i < 2; i++) {
          expect(await queryRequestIdOverWebSocket()).toEqual({
            data: { requestId: 'static' },
          });
        }

        expectDistinctContexts(2);
        expect(Reflect.ownKeys(sharedContext)).toEqual(['tenant', 'req']);
      });

      afterEach(async () => {
        await app.close();
      });
    });
  });
});
