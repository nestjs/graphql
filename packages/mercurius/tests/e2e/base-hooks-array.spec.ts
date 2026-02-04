import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { HOOKS_INVOCATIONS } from '../hooks/base-array/graphql.config';
import { ApplicationModule } from '../hooks/base-array/hooks.module';
import { MockLogger } from '../hooks/mocks/logger.mock';

describe('Base hooks in array format', () => {
  let app: INestApplication;
  let logger: MockLogger;

  beforeEach(async () => {
    logger = new MockLogger();
    app = await NestFactory.create(ApplicationModule, new FastifyAdapter(), {
      logger,
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  it('hooks should be triggered', async () => {
    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: '{ getAnimalName }',
      })
      .expect(200, {
        data: {
          getAnimalName: 'cat',
        },
      });
    expect(HOOKS_INVOCATIONS.preParsing).toEqual([1, 1]);
    expect(HOOKS_INVOCATIONS.preValidation).toEqual([1, 1]);
    expect(HOOKS_INVOCATIONS.preExecution).toEqual([1, 1]);
    expect(HOOKS_INVOCATIONS.onResolution).toEqual([1, 1]);
  });

  afterEach(async () => {
    await app.close();
  });
});
