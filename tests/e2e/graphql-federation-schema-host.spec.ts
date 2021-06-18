import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../graphql-federation/posts-service/federation-posts.module';
import { GraphQLSchemaHost } from '../../lib';
import { GraphQLSchema } from 'graphql';

describe('GraphQL federation GraphQLSchemaHost using', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it(`GraphQLSchemaHost should contain schema`, () => {
      const schemaHost = app.get(GraphQLSchemaHost)

      expect(schemaHost.schema).toBeInstanceOf(GraphQLSchema)
  });

  afterEach(async () => {
    await app.close();
  });
});
