import { INestApplication } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { AppModule as CodeFirstModule } from '../code-first-duplicate-resolvers/app.module';
import { AppModule as SchemaFirstModule } from '../duplicate-resolvers/app.module';

describe('Duplicate resolvers', () => {
  let app: INestApplication;

  describe('code-first', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [CodeFirstModule],
      }).compile();

      app = module.createNestApplication(new FastifyAdapter());
      await app.init();
    });

    it('should return results from both resolvers', async () => {
      const fastifyInstance = app.getHttpAdapter().getInstance();
      await fastifyInstance.ready();

      const response = await fastifyInstance.graphql(`
        mutation {
          moduleALogin(code:"hello")
          moduleBLogin(username:"bye")
        }
      `);

      expect(response.data).toEqual({
        moduleALogin: 'hello',
        moduleBLogin: 'bye',
      });
    });
  });

  describe('schema-first', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [SchemaFirstModule],
      }).compile();

      app = module.createNestApplication(new FastifyAdapter());
      await app.init();
    });

    it('should return results from both resolvers', async () => {
      const fastifyInstance = app.getHttpAdapter().getInstance();
      await fastifyInstance.ready();

      const response = await fastifyInstance.graphql(`
        mutation {
          moduleALogin(code:"hello")
          moduleBLogin(username:"bye")
        }
      `);

      expect(response.data).toEqual({
        moduleALogin: 'hello',
        moduleBLogin: 'bye',
      });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
