import { INestApplication } from '@nestjs/common';
import { ResolverDecoratorHost } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ApplicationModule } from '../graphql/app.module';

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

    app = module.createNestApplication();

    const resolverDecoratorHost = app.get(ResolverDecoratorHost);
    resolverDecoratorHost.setOnRequestStartHook((ctx) => {
      startCalls.push(ctx);
      return { startedAt: 1 };
    });
    resolverDecoratorHost.setOnRequestEndHook((ctx) => {
      endCalls.push(ctx);
    });

    await app.init();
  });

  it('should call the start/end hooks once per operation', async () => {
    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: 'GetCats',
        variables: {},
        query: 'query GetCats { getCats { id } }',
      })
      .expect(200);

    expect(startCalls.length).toEqual(1);
    expect(endCalls.length).toEqual(1);

    expect(startCalls[0].query).toContain('getCats');
    expect(startCalls[0].operationName).toEqual('GetCats');
    expect(startCalls[0].variables).toEqual({});
    expect(startCalls[0].context).toBeDefined();

    expect(endCalls[0].operationName).toEqual('GetCats');
    expect(endCalls[0].errors).toBeUndefined();
    expect(endCalls[0].state).toEqual({ startedAt: 1 });
  });

  it('should expose errors in the end hook', async () => {
    await request(app.getHttpServer()).post('/graphql').send({
      operationName: 'GetCat',
      variables: {},
      query: 'query GetCat { cat(id: 1) { unknownField } }',
    });

    expect(endCalls.length).toEqual(1);
    expect(endCalls[0].errors?.length).toBeGreaterThan(0);
  });

  afterEach(async () => {
    await app.close();
  });
});
