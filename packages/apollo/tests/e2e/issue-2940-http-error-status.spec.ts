import { BadRequestException, INestApplication, Module } from '@nestjs/common';
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
  throwGraphqlErrorWithHttpStatus(): string {
    throw new GraphQLError('boom', {
      extensions: {
        code: 'BAD_REQUEST',
        http: { status: 400 },
      },
    });
  }
}

function buildModule(autoTransformHttpErrors?: boolean) {
  @Module({
    imports: [
      GraphQLModule.forRoot<ApolloDriverConfig>({
        driver: ApolloDriver,
        autoSchemaFile: true,
        includeStacktraceInErrorResponses: false,
        autoTransformHttpErrors,
      }),
    ],
    providers: [IssueResolver],
  })
  class Issue2940Module {}
  return Issue2940Module;
}

async function bootstrap(autoTransformHttpErrors?: boolean) {
  const moduleRef = await Test.createTestingModule({
    imports: [buildModule(autoTransformHttpErrors)],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

describe('Issue #2940 - GraphQL error formatting with HTTP status', () => {
  describe('default (autoTransformHttpErrors enabled)', () => {
    let app: INestApplication;

    beforeEach(async () => {
      app = await bootstrap();
    });

    afterEach(async () => {
      await app.close();
    });

    it('should return the standard {data, errors} response shape (HTTP 200) when a NestJS HttpException is thrown from a resolver', async () => {
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

    it('should keep the response at HTTP 200 when a resolver throws a GraphQLError carrying extensions.http.status', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ throwGraphqlErrorWithHttpStatus }' });

      expect(res.status).toBe(200);
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
      app = await bootstrap(false);
    });

    afterEach(async () => {
      await app.close();
    });

    it('should preserve Apollo Server`s extensions.http.status response status when the user opts out', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ throwGraphqlErrorWithHttpStatus }' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('data', null);
      expect(res.body).toHaveProperty('errors');
    });
  });
});
