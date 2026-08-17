import { INestApplication } from '@nestjs/common';
import { ResolverDecoratorHost } from '@nestjs/graphql';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ApplicationModule } from '../hooks/base/hooks.module';

describe('Request lifecycle hooks', () => {
  let app: INestApplication;
  let startCalls: any[];
  let endCalls: any[];

  beforeEach(async () => {
    startCalls = [];
    endCalls = [];

    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication(new FastifyAdapter());

    const resolverDecoratorHost = app.get(ResolverDecoratorHost);
    resolverDecoratorHost.setOnRequestStartHook((ctx) => {
      startCalls.push(ctx);
      return { startedAt: 1 };
    });
    resolverDecoratorHost.setOnRequestEndHook((ctx) => {
      endCalls.push(ctx);
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  it('should call the start/end hooks once per operation', async () => {
    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: 'GetAnimalName',
        variables: {},
        query: 'query GetAnimalName { getAnimalName }',
      })
      .expect(200, { data: { getAnimalName: 'cat' } });

    expect(startCalls.length).toEqual(1);
    expect(endCalls.length).toEqual(1);

    expect(startCalls[0].query).toContain('getAnimalName');
    expect(startCalls[0].operationName).toEqual('GetAnimalName');
    expect(startCalls[0].variables).toEqual({});
    expect(startCalls[0].context).toBeDefined();

    expect(endCalls[0].operationName).toEqual('GetAnimalName');
    expect(endCalls[0].errors).toBeUndefined();
    expect(endCalls[0].state).toEqual({ startedAt: 1 });
  });

  afterEach(async () => {
    await app.close();
  });
});
