import { BadRequestException, INestApplication, Module } from '@nestjs/common';
import { GraphQLModule, Query, Resolver } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { GraphQLError } from 'graphql';
import request from 'supertest';
import { ApolloDriver, ApolloDriverConfig } from '../../lib';

@Resolver()
class Issue3997Resolver {
  @Query(() => String)
  throwHttpException(): string {
    throw new BadRequestException('validation error');
  }

  @Query(() => String)
  throwGraphqlErrorWithHttpStatus(): string {
    throw new GraphQLError('forbidden', {
      extensions: {
        code: 'FORBIDDEN',
        http: { status: 403 },
      },
    });
  }

  @Query(() => String)
  success(): string {
    return 'success';
  }
}

function buildModule(
  autoTransformHttpErrors?: boolean,
  preserveHttpStatusForExecutionErrors?: boolean,
) {
  @Module({
    imports: [
      GraphQLModule.forRoot<ApolloDriverConfig>({
        driver: ApolloDriver,
        autoSchemaFile: true,
        includeStacktraceInErrorResponses: false,
        autoTransformHttpErrors,
        preserveHttpStatusForExecutionErrors,
      }),
    ],
    providers: [Issue3997Resolver],
  })
  class Issue3997Module {}
  return Issue3997Module;
}

async function bootstrap(
  autoTransformHttpErrors?: boolean,
  preserveHttpStatusForExecutionErrors?: boolean,
) {
  const moduleRef = await Test.createTestingModule({
    imports: [
      buildModule(autoTransformHttpErrors, preserveHttpStatusForExecutionErrors),
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

describe('Issue #3997 - Granular HTTP status preservation control', () => {
  describe('default behavior (both flags enabled)', () => {
    let app: INestApplication;

    beforeEach(async () => {
      app = await bootstrap();
    });

    afterEach(async () => {
      await app.close();
    });

    it('should return HTTP 200 with execution errors when both flags are enabled', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ throwHttpException }' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data', null);
      expect(res.body).toHaveProperty('errors');
      expect(res.body.errors[0].extensions).toMatchObject({
        code: 'BAD_REQUEST',
      });
    });

    it('should return HTTP 200 with GraphQL errors carrying status when preserve is enabled', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ throwGraphqlErrorWithHttpStatus }' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data', null);
      expect(res.body).toHaveProperty('errors');
      expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN');
    });

    it('should still return non-200 for request-level errors when preserve is enabled', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ throwHttpException ' });

      expect(res.status).toBe(400);
      expect(res.body).not.toHaveProperty('data');
      expect(res.body).toHaveProperty('errors');
    });

    it('should return HTTP 200 for successful queries', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ success }' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).not.toHaveProperty('errors');
    });
  });

  describe('with preserveHttpStatusForExecutionErrors disabled', () => {
    let app: INestApplication;

    beforeEach(async () => {
      app = await bootstrap(true, false);
    });

    afterEach(async () => {
      await app.close();
    });

    it('should preserve HTTP status from GraphQL errors when preserve flag is false', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ throwGraphqlErrorWithHttpStatus }' });

      // HTTP status should be preserved from extensions.http.status (403)
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('data', null);
      expect(res.body).toHaveProperty('errors');
      expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN');
    });

    it('should still transform HttpException to GraphQL errors when autoTransformHttpErrors is enabled', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ throwHttpException }' });

      // Even with preserveHttpStatusForExecutionErrors=false, we still get the
      // transformed error from autoTransformHttpErrors
      expect(res.body).toHaveProperty('errors');
      expect(res.body.errors[0].extensions).toHaveProperty('code');
    });

    it('should return HTTP 200 for successful queries', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ success }' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).not.toHaveProperty('errors');
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

    it('should preserve HTTP status from GraphQL errors when autoTransform is disabled', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ throwGraphqlErrorWithHttpStatus }' });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('data', null);
      expect(res.body).toHaveProperty('errors');
    });

    it('should return HTTP 200 for successful queries', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ success }' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).not.toHaveProperty('errors');
    });
  });

  describe('with both flags disabled', () => {
    let app: INestApplication;

    beforeEach(async () => {
      app = await bootstrap(false, false);
    });

    afterEach(async () => {
      await app.close();
    });

    it('should preserve GraphQL error HTTP status without any transformation', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ throwGraphqlErrorWithHttpStatus }' });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('data', null);
      expect(res.body).toHaveProperty('errors');
    });

    it('should return HTTP 200 for successful queries', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ success }' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).not.toHaveProperty('errors');
    });
  });

  describe('backward compatibility', () => {
    it('should maintain existing behavior when preserveHttpStatusForExecutionErrors is not specified', async () => {
      const app = await bootstrap(true, undefined);

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ throwHttpException }' });

      // With only autoTransformHttpErrors enabled and preserveHttpStatusForExecutionErrors undefined,
      // should default to true (preserving status as 200)
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('errors');

      await app.close();
    });

    it('should work with autoTransformHttpErrors=false legacy behavior', async () => {
      const app = await bootstrap(false, undefined);

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ throwGraphqlErrorWithHttpStatus }' });

      // When autoTransformHttpErrors=false and preserveHttpStatusForExecutionErrors is undefined,
      // the preserve plugin should not be injected
      expect(res.status).toBe(403);

      await app.close();
    });
  });
});
