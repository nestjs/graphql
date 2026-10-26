import { INestApplication } from '@nestjs/common';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { printSchema } from 'graphql';
import request from 'supertest';
import { MutationPayloadQueryModule } from '../code-first-mutation-payload-query/app.module.js';

describe('Code-first mutation payload query', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MutationPayloadQueryModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should expose the root Query type on the mutation payload', () => {
    const { schema } = app.get(GraphQLSchemaHost);
    expect(printSchema(schema)).toContain(
      'type AddTodoPayload {\n  todo: Todo!\n  query: Query!\n}',
    );
  });

  it('should resolve root queries through the mutation payload', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            addTodo(title: "second") {
              todo { title }
              query {
                todoCount
                todos { title }
              }
            }
          }
        `,
      })
      .expect(200);

    expect(body).toEqual({
      data: {
        addTodo: {
          todo: { title: 'second' },
          query: {
            todoCount: 2,
            todos: [{ title: 'first' }, { title: 'second' }],
          },
        },
      },
    });
  });
});
