import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { ApolloServer } from '@apollo/server';
import { gql } from 'graphql-tag';
import { ApolloDriver, ApolloDriverConfig } from '../../lib';
import { ProductsModule } from '../code-first-register-in/products/products.module';
import { UsersModule } from '../code-first-register-in/users/users.module';
import { expectSingleResult } from '../utils/assertion-utils';

const buildApp = async (include?: Function[]) => {
  const moduleRef = await Test.createTestingModule({
    imports: [
      UsersModule,
      ProductsModule,
      GraphQLModule.forRoot<ApolloDriverConfig>({
        driver: ApolloDriver,
        autoSchemaFile: true,
        includeStacktraceInErrorResponses: false,
        ...(include ? { include } : {}),
      }),
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const apolloClient = app.get<GraphQLModule<ApolloDriver>>(GraphQLModule)
    .graphQlAdapter?.instance as ApolloServer;

  return { app, apolloClient };
};

const queryTypeName = async (apolloClient: ApolloServer, name: string) => {
  const response = await apolloClient.executeOperation({
    query: gql`
      query TypeByName($name: String!) {
        __type(name: $name) {
          name
        }
      }
    `,
    variables: { name },
  });
  return expectSingleResult(response);
};

describe('Code-first - registerIn', () => {
  describe('include: [UsersModule]', () => {
    let app: INestApplication;
    let apolloClient: ApolloServer;

    beforeAll(async () => {
      ({ app, apolloClient } = await buildApp([UsersModule]));
    });

    afterAll(async () => {
      await app.close();
    });

    it('should expose User type', async () => {
      (await queryTypeName(apolloClient, 'User')).toEqual({
        __type: { name: 'User' },
      });
    });

    it('should expose CreateUserInput type', async () => {
      (await queryTypeName(apolloClient, 'CreateUserInput')).toEqual({
        __type: { name: 'CreateUserInput' },
      });
    });

    it('should expose AppInfo (no registerIn) referenced by User', async () => {
      (await queryTypeName(apolloClient, 'AppInfo')).toEqual({
        __type: { name: 'AppInfo' },
      });
    });

    it('should NOT expose Product type', async () => {
      (await queryTypeName(apolloClient, 'Product')).toEqual({ __type: null });
    });

    it('should NOT expose products query field', async () => {
      const response = await apolloClient.executeOperation({
        query: gql`
          {
            __schema {
              queryType {
                fields {
                  name
                }
              }
            }
          }
        `,
      });
      const data = (response.body as any).singleResult.data as {
        __schema: { queryType: { fields: { name: string }[] } };
      };
      const fieldNames = data.__schema.queryType.fields.map((f) => f.name);
      expect(fieldNames).toContain('users');
      expect(fieldNames).not.toContain('products');
    });

    it('should resolve users query', async () => {
      const response = await apolloClient.executeOperation({
        query: gql`
          {
            users {
              id
              name
              info {
                version
              }
            }
          }
        `,
      });
      expectSingleResult(response).toEqual({
        users: [{ id: '1', name: 'Ada', info: { version: '1.0.0' } }],
      });
    });

    it('should resolve createUser mutation', async () => {
      const response = await apolloClient.executeOperation({
        query: gql`
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
              name
            }
          }
        `,
        variables: { input: { name: 'Grace' } },
      });
      expectSingleResult(response).toEqual({
        createUser: { id: '2', name: 'Grace' },
      });
    });
  });

  describe('include: [UsersModule, ProductsModule]', () => {
    let app: INestApplication;
    let apolloClient: ApolloServer;

    beforeAll(async () => {
      ({ app, apolloClient } = await buildApp([UsersModule, ProductsModule]));
    });

    afterAll(async () => {
      await app.close();
    });

    it('should expose both User and Product types', async () => {
      (await queryTypeName(apolloClient, 'User')).toEqual({
        __type: { name: 'User' },
      });
      (await queryTypeName(apolloClient, 'Product')).toEqual({
        __type: { name: 'Product' },
      });
    });

    it('should resolve users and products queries', async () => {
      const response = await apolloClient.executeOperation({
        query: gql`
          {
            users {
              id
              name
            }
            products {
              id
              name
            }
          }
        `,
      });
      expectSingleResult(response).toEqual({
        users: [{ id: '1', name: 'Ada' }],
        products: [{ id: '1', name: 'Widget' }],
      });
    });
  });

  describe('include omitted', () => {
    let app: INestApplication;
    let apolloClient: ApolloServer;

    beforeAll(async () => {
      ({ app, apolloClient } = await buildApp());
    });

    afterAll(async () => {
      await app.close();
    });

    it('should expose all types regardless of registerIn', async () => {
      (await queryTypeName(apolloClient, 'User')).toEqual({
        __type: { name: 'User' },
      });
      (await queryTypeName(apolloClient, 'Product')).toEqual({
        __type: { name: 'Product' },
      });
      (await queryTypeName(apolloClient, 'AppInfo')).toEqual({
        __type: { name: 'AppInfo' },
      });
    });

    it('should resolve queries from all modules', async () => {
      const response = await apolloClient.executeOperation({
        query: gql`
          {
            users {
              id
              name
            }
            products {
              id
              name
            }
          }
        `,
      });
      expectSingleResult(response).toEqual({
        users: [{ id: '1', name: 'Ada' }],
        products: [{ id: '1', name: 'Widget' }],
      });
    });
  });
});
