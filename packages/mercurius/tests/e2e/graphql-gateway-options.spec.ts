import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { MercuriusGatewayDriver } from '../../lib/drivers/index.js';
import { MercuriusGatewayDriverConfig } from '../../lib/index.js';

describe('MercuriusGatewayDriver options', () => {
  describe('"context"', () => {
    it('should give each request its own context object with "req"', async () => {
      const sharedContext = { tenant: 'static' };
      const driver = new MercuriusGatewayDriver();
      const options = await driver.mergeDefaultOptions({
        context: () => sharedContext,
      });
      const contextFn = options.context as (...args: unknown[]) => any;

      const firstRequest = { id: 'first' };
      const secondRequest = { id: 'second' };
      const first = await contextFn(firstRequest, {});
      const second = await contextFn(secondRequest, {});

      expect(first).not.toBe(sharedContext);
      expect(second).not.toBe(first);
      expect(first).toMatchObject({ tenant: 'static', req: firstRequest });
      expect(second).toMatchObject({ tenant: 'static', req: secondRequest });
      expect(Reflect.ownKeys(sharedContext)).toEqual(['tenant']);
    });
  });

  describe('"transformSchema"', () => {
    let app: INestApplication;

    afterEach(async () => {
      await app?.close();
    });

    it('should refuse to start instead of silently ignoring it', async () => {
      const module = await Test.createTestingModule({
        imports: [
          GraphQLModule.forRoot<MercuriusGatewayDriverConfig>({
            driver: MercuriusGatewayDriver,
            gateway: {
              services: [{ name: 'users', url: 'http://127.0.0.1:1/graphql' }],
            },
            transformSchema: (schema) => schema,
          }),
        ],
      }).compile();

      app = module.createNestApplication(new FastifyAdapter());
      await expect(app.init()).rejects.toThrow(
        /"transformSchema" option is not supported by the MercuriusGatewayDriver/,
      );
    });
  });
});
