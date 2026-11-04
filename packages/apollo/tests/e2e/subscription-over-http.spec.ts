import {
  CanActivate,
  INestApplication,
  Injectable,
  Module,
  UseGuards,
} from '@nestjs/common';
import {
  Args,
  GraphQLModule,
  Int,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { ExpressAdapter } from '@nestjs/platform-express';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  ApolloDriver,
  ApolloDriverConfig,
  ApolloFederationDriver,
} from '../../lib/index.js';

@Injectable()
class DenyGuard implements CanActivate {
  canActivate() {
    return false;
  }
}

@Resolver()
@UseGuards(DenyGuard)
class AccountsResolver {
  static RESOLVE_CALLS = 0;

  @Query(() => Int)
  balance(): number {
    return 0;
  }

  @Subscription(() => Int, {
    resolve(_payload: unknown, args: { id: number }) {
      AccountsResolver.RESOLVE_CALLS++;
      return args.id * 1000;
    },
  })
  balanceChanged(@Args('id', { type: () => Int }) _id: number) {
    throw new Error('Not reached: the guard refuses every subscriber');
  }
}

describe.each([
  ['ApolloDriver', ApolloDriver, () => new ExpressAdapter()],
  ['ApolloDriver', ApolloDriver, () => new FastifyAdapter()],
  [
    'ApolloFederationDriver',
    ApolloFederationDriver,
    () => new ExpressAdapter(),
  ],
])('Subscription operations over HTTP (%s, %#)', (_, driver, createAdapter) => {
  let app: INestApplication;

  beforeEach(async () => {
    @Module({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver,
          autoSchemaFile: true,
          includeStacktraceInErrorResponses: false,
        }),
      ],
      providers: [AccountsResolver, DenyGuard],
    })
    class AppModule {}

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication(createAdapter());
    await app.init();
    const instance = app.getHttpAdapter().getInstance();
    if ('ready' in instance && typeof instance.ready === 'function') {
      await instance.ready();
    }
    AccountsResolver.RESOLVE_CALLS = 0;
  });

  afterEach(async () => {
    await app.close();
  });

  it('should refuse a subscription operation sent as a POST', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: 'subscription { balanceChanged(id: 1) }' })
      .expect(400);

    expect(res.body.data).toBeUndefined();
    expect(res.body.errors).toEqual([
      expect.objectContaining({
        message: expect.stringContaining(
          'Subscription operations are not supported over HTTP',
        ),
        extensions: expect.objectContaining({ code: 'BAD_REQUEST' }),
      }),
    ]);
    expect(AccountsResolver.RESOLVE_CALLS).toBe(0);
  });

  it('should refuse a subscription operation sent as a GET', async () => {
    await request(app.getHttpServer())
      .get('/graphql')
      .query({ query: 'subscription { balanceChanged(id: 1) }' })
      .set('apollo-require-preflight', 'true')
      .expect((res) => expect(res.status).toBeGreaterThanOrEqual(400));

    expect(AccountsResolver.RESOLVE_CALLS).toBe(0);
  });

  it('should still execute queries', async () => {
    await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ __typename }' })
      .expect(200, { data: { __typename: 'Query' } });
  });
});
