import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { ApplicationModule } from '../type-graphql-federation/app.module';

describe.skip('TypeGraphQL - Federation', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it(`should return query result`, () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: `
        {
          _service { sdl }
        }`,
      })
      .expect(200, {
        data: {
          _service: {
            sdl:
              'type Post @key(fields: "id") {\n  id: ID!\n  title: String!\n  authorId: Int!\n}\n\ntype Query {\n  findPost(id: Float!): Post!\n  getPosts: [Post!]!\n}\n\ntype User @extends @key(fields: "id") {\n  id: ID! @external\n  posts: [Post!]!\n}\n',
          },
        },
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
