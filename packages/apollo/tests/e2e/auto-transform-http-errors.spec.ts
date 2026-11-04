import {
  HttpException,
  INestApplication,
  Module,
  NotFoundException,
} from '@nestjs/common';
import { GraphQLModule, Query, Resolver } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ApolloDriver, ApolloDriverConfig } from '../../lib/index.js';

@Resolver()
class ErrorsResolver {
  @Query(() => String)
  throwHttpException(): string {
    throw new NotFoundException('invoice not found');
  }

  @Query(() => String)
  throwHttpExceptionWithStringResponse(): string {
    throw new HttpException('Sign in first', 401);
  }

  @Query(() => String)
  throwHttpClientError(): string {
    // Same shape as the errors thrown by HTTP clients such as superagent:
    // "status" and "response.statusCode" are set, but it is not an HttpException
    const error = new Error('Not Found') as any;
    error.status = 404;
    error.response = {
      statusCode: 404,
      req: { headers: { authorization: 'Bearer secret' } },
    };
    throw error;
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      includeStacktraceInErrorResponses: false,
    }),
  ],
  providers: [ErrorsResolver],
})
class AppModule {}

describe('autoTransformHttpErrors', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const query = (fieldName: string) =>
    request(app.getHttpServer())
      .post('/graphql')
      .send({ query: `{ ${fieldName} }` });

  it('should map an HttpException and expose its response as "originalError"', async () => {
    const res = await query('throwHttpException');

    expect(res.body.errors[0].message).toBe('invoice not found');
    expect(res.body.errors[0].extensions).toEqual({
      code: 'INTERNAL_SERVER_ERROR',
      status: 404,
      originalError: {
        statusCode: 404,
        message: 'invoice not found',
        error: 'Not Found',
      },
    });
  });

  it('should map an HttpException created with a string response', async () => {
    const res = await query('throwHttpExceptionWithStringResponse');

    expect(res.body.errors[0].message).toBe('Sign in first');
    expect(res.body.errors[0].extensions).toEqual({
      code: 'UNAUTHENTICATED',
      originalError: 'Sign in first',
    });
  });

  it('should not transform errors that only look like an HttpException', async () => {
    const res = await query('throwHttpClientError');

    expect(res.body.errors[0].message).toBe('Not Found');
    expect(res.body.errors[0].extensions).toEqual({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});
