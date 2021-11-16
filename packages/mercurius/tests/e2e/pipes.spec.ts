import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { ApplicationModule } from '../code-first/app.module';

describe('GraphQL - Pipes', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication(new FastifyAdapter());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  it(`should throw an error`, () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query:
          'mutation {\n  addRecipe(newRecipeData: {title: "test", ingredients: []}) {\n    id\n  }\n}\n',
      })
      .expect(200, {
        data: null,
        errors: [
          {
            extensions: {
              code: 'BAD_USER_INPUT',
              response: {
                error: 'Bad Request',
                message: [
                  'description must be longer than or equal to 30 characters',
                ],
                statusCode: 400,
              },
            },
            message: 'Bad Request Exception',
          },
        ],
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
