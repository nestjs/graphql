import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { ApplicationModule } from '../code-first/app.module';
import { LogMiddleware } from '../code-first/common/middleware/log.middleware';
import { AuthMiddleware } from '../code-first/common/middleware/auth.middleware';

describe('Middleware', () => {
  let app: INestApplication;
  let middlewareMock = jest.fn();
  let logMock = jest.fn();
  let authMock = jest.fn();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    });

    module.overrideProvider(LogMiddleware).useValue(
      new LogMiddleware((msg: string) => {
        middlewareMock(msg);
        logMock(msg);
      }),
    );

    module.overrideProvider(AuthMiddleware).useValue(
      new AuthMiddleware((context) => {
        middlewareMock(context.req.headers['authorization']);

        if (context?.req?.headers['authorization'] !== 'Bearer abc123') {
          throw new UnauthorizedException();
        }

        authMock(context);
      }),
    );

    app = (await module.compile()).createNestApplication();
    await app.init();
  });

  it('should return the internalNotes', async () => {
    await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', 'Bearer abc123')
      .send({
        operationName: null,
        variables: {},
        query: `
        {
          recipes {
            internalNotes
          }
        }`,
      })
      .expect(200, {
        data: {
          recipes: [
            {
              internalNotes: 'Extra Pepperoni',
            },
            {
              internalNotes: 'Extra Meatballs',
            },
          ],
        },
      });

    expect(middlewareMock).toHaveBeenCalledTimes(4);
    expect(middlewareMock.mock.calls).toEqual([
      ['Logging access: guest -> Recipe.internalNotes -> Extra Pepperoni'],
      ['Bearer abc123'],
      ['Logging access: guest -> Recipe.internalNotes -> Extra Meatballs'],
      ['Bearer abc123'],
    ]);
  });

  it('throws unauthorized error from middleware', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', 'Bearer invalid')
      .send({
        operationName: null,
        variables: {},
        query: `
        {
          recipes {
            internalNotes
          }
        }`,
      })
      .expect(200);

    expect(body).toBeDefined();
    expect(body.data).toBeNull();
    expect(body.errors).toBeDefined();
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0].message).toEqual('Unauthorized');

    expect(middlewareMock).toHaveBeenCalledTimes(4);
    expect(middlewareMock.mock.calls).toEqual([
      ['Logging access: guest -> Recipe.internalNotes -> Extra Pepperoni'],
      ['Bearer invalid'],
      ['Logging access: guest -> Recipe.internalNotes -> Extra Meatballs'],
      ['Bearer invalid'],
    ]);
  });

  afterEach(async () => {
    await app.close();

    jest.clearAllMocks();
  });
});
