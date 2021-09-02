import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApolloServerBase } from 'apollo-server-core';
import { gql } from 'apollo-server-express';
import { getApolloServer } from '../../lib';
import { ApplicationModule } from '../code-first/app.module';
import { CatsModule } from '../code-first/cats/cats.module';

describe('Resolver-registration-methods', () => {
  let app: INestApplication;
  let apolloClient: ApolloServerBase;

  describe('useClass', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [ApplicationModule, CatsModule.register('useClass')],
      }).compile();

      app = module.createNestApplication();
      await app.init();
      apolloClient = getApolloServer(module);
    });

    it('should return the cats result', async () => {
      const response = await apolloClient.executeOperation({
        query: gql`
          {
            getAnimalName
          }
        `,
      });

      expect(response.data).toEqual({
        getAnimalName: 'cat',
      });
    });
  });

  describe('useValue', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [ApplicationModule, CatsModule.register('useValue')],
      }).compile();

      app = module.createNestApplication();
      await app.init();
      apolloClient = getApolloServer(module);
    });

    it('should return the cats result', async () => {
      const response = await apolloClient.executeOperation({
        query: gql`
          {
            getAnimalName
          }
        `,
      });

      expect(response.data).toEqual({
        getAnimalName: 'cat',
      });
    });
  });

  describe('useFactory', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [ApplicationModule, CatsModule.register('useFactory')],
      }).compile();

      app = module.createNestApplication();
      await app.init();
      apolloClient = getApolloServer(module);
    });

    it('should return the cats result', async () => {
      const response = await apolloClient.executeOperation({
        query: gql`
          {
            getAnimalName
          }
        `,
      });

      expect(response.data).toEqual({
        getAnimalName: 'cat',
      });
    });
  });
});
