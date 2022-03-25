import { INestApplication } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { FastifyInstance } from 'fastify';
import { ApplicationModule } from '../plugins/code-first-plugin-options/app.module';
import { NEW_PLUGIN_URL } from '../plugins/mocks/utils/constants';

describe('Code-first', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication(new FastifyAdapter());
    await app.init();
  });

  it('should get the plugin', async () => {
    const fastifyInstance: FastifyInstance = app.getHttpAdapter().getInstance();
    await fastifyInstance.ready();

    const response = await fastifyInstance.inject({
      method: 'GET',
      url: NEW_PLUGIN_URL,
    });
    const data = JSON.parse(response.body);
    expect(fastifyInstance.printPlugins().includes('mockPlugin')).toBe(true);
    expect(response.statusCode).toBe(200);
    expect(data.from).toBe(NEW_PLUGIN_URL);
  });

  it('it should query cat', async () => {
    const fastifyInstance: FastifyInstance = app.getHttpAdapter().getInstance();
    await fastifyInstance.ready();

    const response = await fastifyInstance.graphql(`
      {
        getAnimalName
      }
    `);
    expect(response.data).toEqual({
      getAnimalName: 'cat',
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
