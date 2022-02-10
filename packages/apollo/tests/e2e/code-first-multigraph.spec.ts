import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication, Type } from '@nestjs/common';
import { buildClientSchema, getIntrospectionQuery, printSchema } from 'graphql';
import * as request from 'supertest';

import { ApplicationModule } from '../code-first-multigraph/app.module';
import { GatewayModule } from '../code-first-multigraph/gateway.module';

async function initNestApp(ModuleClass: Type<any>) {
  const module = await Test.createTestingModule({
    imports: [ModuleClass],
  }).compile();

  const app = await module.createNestApplication();
  await app.init();
  return app;
}

async function getSDL(app: INestApplication, endpoint: string) {
  const { body, status } = await request(app.getHttpServer())
    .post(endpoint)
    .send({
      query: `{ _service { sdl } } `,
    });
  expect(status).toBe(HttpStatus.OK);
  return body.data._service.sdl;
}

async function introspect(app: INestApplication, endpoint: string) {
  const { body, status } = await request(app.getHttpServer())
    .post(endpoint)
    .send({ query: getIntrospectionQuery() });

  expect(status).toBe(HttpStatus.OK);
  return printSchema(buildClientSchema(body.data));
}

describe('Multiple GraphQL endpoints in the same application', () => {
  describe('Application', () => {
    it('should successfully start the application', async () => {
      const app = await initNestApp(ApplicationModule);
      await app.close();
    });

    describe('Schema', () => {
      let app: INestApplication;

      beforeAll(async () => {
        app = await initNestApp(ApplicationModule);
      });

      afterAll(() => app.close());

      it('should constrain the UserModule schema to its submodule definitions', async () => {
        const sdl = await getSDL(app, '/user/graphql');

        expect(sdl).toMatchInlineSnapshot(`
        "type Query {
          users: [User!]!
          user(id: ID!): User!
        }
        
        type User @key(fields: \\"id\\") {
          id: ID!
          name: String!
        }
        "
        `);
      });

      it('should constrain the PostModule schema to its submodule definitions', async () => {
        const sdl = await getSDL(app, '/post/graphql');

        expect(sdl).toMatchInlineSnapshot(`
        "type Query {
          posts: [Post!]!
          post(id: ID!): [Post!]!
        }
        
        type Post @key(fields: \\"id\\") {
          id: ID!
          title: String!
          status: Publication!
          authorId: ID!
          user: User!
        }
        
        enum Publication {
          PUBLISHED
          DRAFT
        }

        type User @extends @key(fields: \\"id\\") {
          id: ID! @external
          posts: [Post!]!
        }
        "
        `);
      });
    });
  });

  describe('Gateway', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await initNestApp(ApplicationModule);
      await app.listen(3000);
    });

    afterAll(() => app.close());

    it('should successfully start the gateway', async () => {
      const gateway = await initNestApp(GatewayModule);
      await gateway.close();
    });

    describe('Schema', () => {
      let gateway: INestApplication;

      beforeAll(async () => {
        gateway = await initNestApp(GatewayModule);
      });

      afterAll(() => gateway.close());

      it('should expose the stitched schema', async () => {
        const schema = await introspect(gateway, '/graphql');

        expect(schema).toMatchInlineSnapshot(`
          "type Post {
            authorId: ID!
            id: ID!
            status: Publication!
            title: String!
            user: User!
          }

          enum Publication {
            DRAFT
            PUBLISHED
          }

          type Query {
            post(id: ID!): [Post!]!
            posts: [Post!]!
            user(id: ID!): User!
            users: [User!]!
          }

          type User {
            id: ID!
            name: String!
            posts: [Post!]!
          }
          "
        `);
      });
    });
  });
});
