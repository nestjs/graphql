import {
  BadRequestException,
  ForbiddenException,
  INestApplication,
  Module,
} from '@nestjs/common';
import { GraphQLModule, Query, Resolver } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { GraphQLError } from 'graphql';
import request from 'supertest';
import { ApolloDriver, ApolloDriverConfig } from '../../lib/index.js';

@Resolver()
class IssueResolver {
  @Query(() => String)
  throwHttpException(): string {
    throw new BadRequestException('foo');
  }

  @Query(() => String)
  throwForbiddenException(): string {
    throw new ForbiddenException('bar');
  }

  @Query(() => String)
  throwGraphqlErrorWithHttpStatus(): string {
    throw new GraphQLError('boom', {
      extensions: {
        code: 'BAD_REQUEST',
        http: { status: 400 },
      },
    });
  }
}

type IssueOptions = Pick<
  ApolloDriverConfig,
  'autoTransformHttpErrors' | 'forceHttpStatus200ForExecutionErrors'
>;

function buildModule(options: IssueOptions = {}) {
  @Module({
    imports: [
      GraphQLModule.forRoot<ApolloDriverConfig>({
        driver: ApolloDriver,
        autoSchemaFile: true,
        includeStacktraceInErrorResponses: false,
        ...options,
      }),
    ],
    providers: [IssueResolver],
  })
  class Issue2940Module {}
  return Issue2940Module;
}

async function bootstrap(options?: IssueOptions) {
  const moduleRef = await Test.createTestingModule({
    imports: [buildModule(options)],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

describe('Issue #2940 - GraphQL error formatting with HTTP status', () => {
  describe('default (autoTransformHttpErrors enabled, force flag disabled)', () => {
    let app: INestApplication;

    beforeEach(async () => {
      app = await bootstrap();
    });

    afterEach(async () => {
      await app.close();
    });

    it('should transform a NestJS HttpException without forcing the response to HTTP 200', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ throwForbiddenException }' });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('data', null);
      expect(res.body).toHaveProperty('errors');
      expect(res.body).not.toHaveProperty('error');
      expect(res.body.errors[0].extensions).toMatchObject({
        code: 'FORBIDDEN',
        originalError: {
          statusCode: 403,
          message: 'bar',
        },
      });
      expect(res.body.errors[0].extensions).not.toHaveProperty('http');
    });

    it('should keep the response at execution-derived status when a GraphQLError has extensions.http.status', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ throwGraphqlErrorWithHttpStatus }' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('data', null);
      expect(res.body).toHaveProperty('errors');
      expect(res.body).not.toHaveProperty('error');
      expect(res.body.errors[0].extensions.code).toBe('BAD_REQUEST');
      expect(res.body.errors[0].extensions).not.toHaveProperty('http');
    });

    it('should still return a non-200 status for request-level errors (e.g. parse failures)', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ throwHttpException ' });

      expect(res.status).toBe(400);
      expect(res.body).not.toHaveProperty('data');
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('with autoTransformHttpErrors disabled', () => {
    let app: INestApplication;

    beforeEach(async () => {
      app = await bootstrap({ autoTransformHttpErrors: false });
    });

    afterEach(async () => {
      await app.close();
    });

    it('should preserve Apollo Server`s extensions.http.status response status', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ throwGraphqlErrorWithHttpStatus }' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('data', null);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('with forceHttpStatus200ForExecutionErrors enabled', () => {
    let app: INestApplication;

    beforeEach(async () => {
      app = await bootstrap({ forceHttpStatus200ForExecutionErrors: true });
    });

    afterEach(async () => {
      await app.close();
    });

    it('should normalize execution-level error responses back to HTTP 200', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ throwGraphqlErrorWithHttpStatus }' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data', null);
      expect(res.body).toHaveProperty('errors');
      expect(res.body).not.toHaveProperty('error');
    });

    it('should still transform NestJS HttpExceptions while normalizing their response status', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ throwHttpException }' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data', null);
      expect(res.body).toHaveProperty('errors');
      expect(res.body).not.toHaveProperty('error');
      expect(res.body.errors[0].extensions).toMatchObject({
        code: 'BAD_REQUEST',
        originalError: {
          statusCode: 400,
          message: 'foo',
        },
      });
      expect(res.body.errors[0].extensions).not.toHaveProperty('http');
    });
  });
});
