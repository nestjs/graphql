import { INestApplication, Module } from '@nestjs/common';
import {
  GraphQLModule,
  Query,
  ResolveField,
  Resolver,
  UseFieldMiddleware,
} from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ApolloDriver, ApolloDriverConfig } from '../../lib/index.js';
import {
  executionLog,
  FieldMiddlewareAppModule,
  FieldMiddlewareAppOptions,
  wrap,
} from '../code-first-field-middleware/app.module.js';

async function createApp(
  options?: FieldMiddlewareAppOptions,
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [FieldMiddlewareAppModule.forRoot(options)],
  }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

async function query(app: INestApplication, source: string) {
  const { body } = await request(app.getHttpServer())
    .post('/graphql')
    .send({ query: source })
    .expect(200);
  expect(body.errors).toBeUndefined();
  return body.data;
}

describe('@UseFieldMiddleware()', () => {
  describe('without global middleware', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createApp();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should apply middleware to property fields in any decorator order', async () => {
      const data = await query(
        app,
        '{ item { above below combined stacked composed plain } }',
      );
      expect(data.item).toEqual({
        above: 'above(value)',
        below: 'below(value)',
        combined: 'option(first(second(value)))',
        stacked: 'lower(upper(value))',
        composed: 'composed(value)',
        plain: 'value',
      });
    });

    it('should apply middleware to field resolvers in any decorator order', async () => {
      const data = await query(
        app,
        '{ item { resolvedAbove resolvedBelow resolvedCombined resolvedFast } }',
      );
      expect(data.item).toEqual({
        resolvedAbove: 'above(value)',
        resolvedBelow: 'below(value)',
        resolvedCombined: 'option(first(second(value)))',
        resolvedFast: 'fast(value)',
      });
    });

    it('should keep the middleware on fields copied by mapped types', async () => {
      const data = await query(app, '{ partialItem { above combined plain } }');
      expect(data.partialItem).toEqual({
        above: 'above(value)',
        combined: 'option(first(second(value)))',
        plain: 'value',
      });
    });
  });

  describe('with global middleware and field resolver guards', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createApp({
        globalMiddleware: true,
        fieldResolverEnhancers: ['guards'],
      });
    });

    afterAll(async () => {
      await app.close();
    });

    beforeEach(() => {
      executionLog.length = 0;
    });

    it('should run global middleware first', async () => {
      const data = await query(
        app,
        '{ item { combined plain resolvedCombined resolvedFast } }',
      );
      expect(data.item).toEqual({
        combined: 'global(option(first(second(value))))',
        plain: 'global(value)',
        resolvedCombined: 'global(option(first(second(value))))',
        resolvedFast: 'global(fast(value))',
      });
    });

    it('should run field middleware before field resolver enhancers', async () => {
      const data = await query(app, '{ item { resolvedGuarded } }');
      expect(data.item.resolvedGuarded).toBe('global(value)');
      expect(executionLog).toEqual(['middleware', 'guard', 'resolver']);
    });
  });

  describe('schema first', () => {
    @Resolver('Book')
    class BookResolver {
      @Query('book')
      book() {
        return {};
      }

      @ResolveField('title')
      @UseFieldMiddleware(wrap('schema-first'))
      title() {
        return 'value';
      }
    }

    @Module({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          typeDefs: 'type Book { title: String! } type Query { book: Book! }',
        }),
      ],
      providers: [BookResolver],
    })
    class SchemaFirstModule {}

    let app: INestApplication;

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [SchemaFirstModule],
      }).compile();
      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should apply middleware to field resolvers', async () => {
      const data = await query(app, '{ book { title } }');
      expect(data.book.title).toBe('schema-first(value)');
    });
  });
});
