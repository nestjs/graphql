import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  Module,
  UseGuards,
} from '@nestjs/common';
import {
  Args,
  GqlExecutionContext,
  GraphQLModule,
  GraphQLSchemaHost,
  Int,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { ExecutionResult, parse, subscribe } from 'graphql';
import { PubSub } from 'graphql-subscriptions';
import request from 'supertest';
import { ApolloDriver, ApolloDriverConfig } from '../../lib/index.js';

const pubSub = new PubSub();

@Injectable()
class StaffGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return GqlExecutionContext.create(context).getContext().staff === true;
  }
}

@Resolver()
@UseGuards(StaffGuard)
class AccountsResolver {
  @Query(() => Int)
  balance() {
    return 944351;
  }

  @Subscription(() => Int, {
    // Builds its answer from the arguments, not from the event
    resolve(this: AccountsResolver, _event: unknown, args: { id: number }) {
      return this.balance() + args.id;
    },
  })
  balanceChanged(@Args('id', { type: () => Int }) _id: number) {
    return pubSub.asyncIterableIterator('balanceChanged');
  }
}

@Module({ providers: [AccountsResolver] })
class AccountsModule {}

describe('GraphQL - "resolve" of a guarded subscription', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        AccountsModule,
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
        }),
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should not run for a subscription sent over HTTP', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: 'subscription { balanceChanged(id: 1) }' });

    expect(body.data?.balanceChanged ?? null).toBeNull();
    expect(body.errors).toHaveLength(1);
  });

  it('should run for the events of a subscription the guard let through', async () => {
    const { schema } = app.get(GraphQLSchemaHost);
    const stream = (await subscribe({
      schema,
      document: parse('subscription { balanceChanged(id: 1) }'),
      contextValue: { staff: true },
    })) as AsyncIterableIterator<ExecutionResult>;

    const delivered = stream.next();
    // the pubsub subscription is registered on the first pull
    await new Promise((resolve) => setTimeout(resolve, 10));
    await pubSub.publish('balanceChanged', {});

    expect((await delivered).value).toEqual({
      data: { balanceChanged: 944352 },
    });
    await stream.return();
  });

  it('should not subscribe for a client the guard refuses', async () => {
    const { schema } = app.get(GraphQLSchemaHost);
    const result = (await subscribe({
      schema,
      document: parse('subscription { balanceChanged(id: 1) }'),
      contextValue: { staff: false },
    })) as ExecutionResult;

    expect(result.errors[0].message).toBe('Forbidden resource');
  });
});
