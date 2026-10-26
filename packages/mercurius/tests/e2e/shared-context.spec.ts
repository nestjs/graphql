import { INestApplication } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { SharedContextModule } from '../graphql/shared-context/shared-context.module.js';
import { SharedContextResolver } from '../graphql/shared-context/shared-context.resolver.js';

describe('GraphQL (context object shared by all requests)', () => {
  let app: INestApplication;
  let sharedContext: Record<string, any>;

  const bootstrap = async (context: unknown) => {
    const module = await Test.createTestingModule({
      imports: [SharedContextModule.forRoot(context)],
    }).compile();

    app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  };

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

  describe('when "context" is an object with its own "req"', () => {
    it('should keep that "req" while still giving each request its own context', async () => {
      sharedContext.req = { headers: { 'x-request-id': 'static' } };
      await bootstrap(sharedContext);

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
