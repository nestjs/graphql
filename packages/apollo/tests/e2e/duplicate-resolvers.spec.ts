import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { ApolloServerBase } from 'apollo-server-core';
import { gql } from 'graphql-tag';
import { ApolloDriver } from '../../lib';
import { AppModule as CodeFirstModule } from '../code-first-duplicate-resolvers/app.module';
import { AppModule as SchemaFirstModule } from '../duplicate-resolvers/app.module';

describe('Duplicate resolvers', () => {
  let app: INestApplication;
  let apolloClient: ApolloServerBase;

  describe('code-first', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [CodeFirstModule],
      }).compile();

      app = module.createNestApplication();
      await app.init();
      const graphqlModule = app.get<GraphQLModule<ApolloDriver>>(GraphQLModule);
      apolloClient = graphqlModule.graphQlAdapter?.instance;
    });

    it('should return results from both resolvers', async () => {
      const response = await apolloClient.executeOperation({
        query: gql`
          mutation {
            moduleALogin(code: "hello")
            moduleBLogin(username: "bye")
          }
        `,
      });

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

      app = module.createNestApplication();
      await app.init();
      const graphqlModule = app.get<GraphQLModule<ApolloDriver>>(GraphQLModule);
      apolloClient = graphqlModule.graphQlAdapter?.instance;
    });

    it('should return results from both resolvers', async () => {
      const response = await apolloClient.executeOperation({
        query: gql`
          mutation {
            moduleALogin(code: "hello")
            moduleBLogin(username: "bye")
          }
        `,
      });

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
