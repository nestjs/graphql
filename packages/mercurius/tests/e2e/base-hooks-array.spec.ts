import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import * as request from 'supertest';
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
    expect(logger.warn).toHaveBeenCalledTimes(8);
    expect(logger.warn).toHaveBeenNthCalledWith(
      1,
      'preParsing1',
      'GqlConfigService',
    );
    expect(logger.warn).toHaveBeenNthCalledWith(
      2,
      'preParsing2',
      'GqlConfigService',
    );
    expect(logger.warn).toHaveBeenNthCalledWith(
      3,
      'preValidation1',
      'GqlConfigService',
    );
    expect(logger.warn).toHaveBeenNthCalledWith(
      4,
      'preValidation2',
      'GqlConfigService',
    );
    expect(logger.warn).toHaveBeenNthCalledWith(
      5,
      'preExecution1',
      'GqlConfigService',
    );
    expect(logger.warn).toHaveBeenNthCalledWith(
      6,
      'preExecution2',
      'GqlConfigService',
    );
    expect(logger.warn).toHaveBeenNthCalledWith(
      7,
      'onResolution1',
      'GqlConfigService',
    );
    expect(logger.warn).toHaveBeenNthCalledWith(
      8,
      'onResolution2',
      'GqlConfigService',
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
