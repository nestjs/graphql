import { INestApplication } from '@nestjs/common';
import { GraphQLSchemaHost } from '@nestjs/graphql-experimental';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { GraphQLSchema } from 'graphql';
import { AppModule } from '../graphql-federation/posts-service/federation-posts.module';

describe('GraphQL federation GraphQLSchemaHost using', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication(new FastifyAdapter());
    await app.init();
  });

  it(`GraphQLSchemaHost should contain schema`, () => {
    const schemaHost = app.get(GraphQLSchemaHost);

    expect(schemaHost.schema).toBeInstanceOf(GraphQLSchema);
  });

  afterEach(async () => {
    await app.close();
  });
});
