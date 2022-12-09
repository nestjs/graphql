import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { ApplicationModule } from '../hooks/base/hooks.module';
import { MockLogger } from '../hooks/mocks/logger.mock';

describe('Base hooks', () => {
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
    expect(logger.warn).toHaveBeenCalledTimes(4);
    expect(logger.warn).toHaveBeenNthCalledWith(
      1,
      'preParsing',
      'GqlConfigService',
    );
    expect(logger.warn).toHaveBeenNthCalledWith(
      2,
      'preValidation',
      'GqlConfigService',
    );
    expect(logger.warn).toHaveBeenNthCalledWith(
      3,
      'preExecution',
      'GqlConfigService',
    );
    expect(logger.warn).toHaveBeenNthCalledWith(
      4,
      'onResolution',
      'GqlConfigService',
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
