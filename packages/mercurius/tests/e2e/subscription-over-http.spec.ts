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
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  MercuriusDriver,
  MercuriusDriverConfig,
  MercuriusFederationDriver,
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
  ['MercuriusDriver', MercuriusDriver],
  ['MercuriusFederationDriver', MercuriusFederationDriver],
])('Subscription operations over HTTP (%s)', (_, driver) => {
  let app: INestApplication;

  beforeEach(async () => {
    @Module({
      imports: [
        GraphQLModule.forRoot<MercuriusDriverConfig>({
          driver,
          autoSchemaFile: true,
          subscription: true,
        }),
      ],
      providers: [AccountsResolver, DenyGuard],
    })
    class AppModule {}

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    AccountsResolver.RESOLVE_CALLS = 0;
  });

  afterEach(async () => {
    await app.close();
  });

  it('should refuse a subscription operation sent as a POST', async () => {
    const query = 'subscription { balanceChanged(id: 1) }';
    // Twice: the second request is served from Mercurius' query cache
    for (let i = 0; i < 2; i++) {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(400);

      expect(res.body.data ?? null).toBeNull();
      expect(res.body.errors).toEqual([
        expect.objectContaining({
          message: expect.stringContaining(
            'Subscription operations are not supported over HTTP',
          ),
        }),
      ]);
    }
    expect(AccountsResolver.RESOLVE_CALLS).toBe(0);
  });

  it('should still execute queries', async () => {
    await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ __typename }' })
      .expect(200, { data: { __typename: 'Query' } });
  });
});
