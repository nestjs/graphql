import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { MercuriusDriver, MercuriusDriverConfig } from '../../lib/index.js';
import { ProductsModule } from '../code-first-register-in/products/products.module.js';
import { UsersModule } from '../code-first-register-in/users/users.module.js';

const buildApp = async (include?: Function[]) => {
  const moduleRef = await Test.createTestingModule({
    imports: [
      UsersModule,
      ProductsModule,
      GraphQLModule.forRoot<MercuriusDriverConfig>({
        driver: MercuriusDriver,
        autoSchemaFile: true,
        ...(include ? { include } : {}),
      }),
    ],
  }).compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );
  await app.init();

  const fastifyInstance = app.getHttpAdapter().getInstance();
  await fastifyInstance.ready();

  return { app, fastifyInstance };
};

describe('Code-first - registerIn', () => {
  describe('include: [UsersModule]', () => {
    let app: INestApplication;
    let fastifyInstance: any;

    beforeAll(async () => {
      ({ app, fastifyInstance } = await buildApp([UsersModule]));
    });

    afterAll(async () => {
      await app.close();
    });

    it('should expose User type', async () => {
      const response = await fastifyInstance.graphql(
        `query { __type(name: "User") { name } }`,
      );
      expect(response.data).toEqual({ __type: { name: 'User' } });
    });

    it('should expose CreateUserInput type', async () => {
      const response = await fastifyInstance.graphql(
        `query { __type(name: "CreateUserInput") { name } }`,
      );
      expect(response.data).toEqual({ __type: { name: 'CreateUserInput' } });
    });

    it('should expose AppInfo (no registerIn) referenced by User', async () => {
      const response = await fastifyInstance.graphql(
        `query { __type(name: "AppInfo") { name } }`,
      );
      expect(response.data).toEqual({ __type: { name: 'AppInfo' } });
    });

    it('should NOT expose Product type', async () => {
      const response = await fastifyInstance.graphql(
        `query { __type(name: "Product") { name } }`,
      );
      expect(response.data).toEqual({ __type: null });
    });

    it('should NOT expose products query field', async () => {
      const response = await fastifyInstance.graphql(`
        {
          __schema {
            queryType {
              fields {
                name
              }
            }
          }
        }
      `);
      const fieldNames = response.data.__schema.queryType.fields.map(
        (f: { name: string }) => f.name,
      );
      expect(fieldNames).toContain('users');
      expect(fieldNames).not.toContain('products');
    });

    it('should resolve users query', async () => {
      const response = await fastifyInstance.graphql(`
        {
          users {
            id
            name
            info {
              version
            }
          }
        }
      `);
      expect(response.data).toEqual({
        users: [{ id: '1', name: 'Ada', info: { version: '1.0.0' } }],
      });
    });

    it('should resolve createUser mutation', async () => {
      const response = await fastifyInstance.graphql(`
        mutation {
          createUser(input: { name: "Grace" }) {
            id
            name
          }
        }
      `);
      expect(response.data).toEqual({
        createUser: { id: '2', name: 'Grace' },
      });
    });
  });

  describe('include: [UsersModule, ProductsModule]', () => {
    let app: INestApplication;
    let fastifyInstance: any;

    beforeAll(async () => {
      ({ app, fastifyInstance } = await buildApp([
        UsersModule,
        ProductsModule,
      ]));
    });

    afterAll(async () => {
      await app.close();
    });

    it('should expose both User and Product types', async () => {
      const userRes = await fastifyInstance.graphql(
        `query { __type(name: "User") { name } }`,
      );
      const productRes = await fastifyInstance.graphql(
        `query { __type(name: "Product") { name } }`,
      );
      expect(userRes.data).toEqual({ __type: { name: 'User' } });
      expect(productRes.data).toEqual({ __type: { name: 'Product' } });
    });

    it('should resolve users and products queries', async () => {
      const response = await fastifyInstance.graphql(`
        {
          users { id name }
          products { id name }
        }
      `);
      expect(response.data).toEqual({
        users: [{ id: '1', name: 'Ada' }],
        products: [{ id: '1', name: 'Widget' }],
      });
    });
  });

  describe('include omitted', () => {
    let app: INestApplication;
    let fastifyInstance: any;

    beforeAll(async () => {
      ({ app, fastifyInstance } = await buildApp());
    });

    afterAll(async () => {
      await app.close();
    });

    it('should expose all types regardless of registerIn', async () => {
      const userRes = await fastifyInstance.graphql(
        `query { __type(name: "User") { name } }`,
      );
      const productRes = await fastifyInstance.graphql(
        `query { __type(name: "Product") { name } }`,
      );
      const appInfoRes = await fastifyInstance.graphql(
        `query { __type(name: "AppInfo") { name } }`,
      );
      expect(userRes.data).toEqual({ __type: { name: 'User' } });
      expect(productRes.data).toEqual({ __type: { name: 'Product' } });
      expect(appInfoRes.data).toEqual({ __type: { name: 'AppInfo' } });
    });

    it('should resolve queries from all modules', async () => {
      const response = await fastifyInstance.graphql(`
        {
          users { id name }
          products { id name }
        }
      `);
      expect(response.data).toEqual({
        users: [{ id: '1', name: 'Ada' }],
        products: [{ id: '1', name: 'Widget' }],
      });
    });
  });
});
