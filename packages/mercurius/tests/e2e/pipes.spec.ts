import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import mercurius from 'mercurius';
import { ApplicationModule } from '../code-first/app.module';

describe('GraphQL - Pipes', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication(new FastifyAdapter());
    app.useGlobalPipes(
      new ValidationPipe({
        exceptionFactory: (errors) =>
          new mercurius.ErrorWithProps('Validation error', { errors }, 200),
      }),
    );
    await app.init();

    await app.getHttpAdapter().getInstance().ready();
  });

  it(`should throw an error`, async () => {
    const fastifyInstance = app.getHttpAdapter().getInstance();
    const response = await fastifyInstance.graphql(
      'mutation {\n  addRecipe(newRecipeData: {title: "test", ingredients: []}) {\n    id\n  }\n}\n',
    );

    expect(response.data).toEqual(null);
    expect(response.errors).toEqual([
      {
        extensions: {
          errors: [
            {
              children: [],
              constraints: {
                isLength:
                  'description must be longer than or equal to 30 characters',
              },
              property: 'description',
              target: {
                ingredients: [],
                title: 'test',
              },
              value: undefined,
            },
          ],
        },
        locations: [
          {
            column: 3,
            line: 2,
          },
        ],
        message: 'Validation error',
        path: ['addRecipe'],
      },
    ]);
  });

  afterEach(async () => {
    await app.close();
  });
});
