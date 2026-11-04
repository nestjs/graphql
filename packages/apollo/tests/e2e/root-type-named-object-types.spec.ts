import {
  CanActivate,
  INestApplication,
  Injectable,
  Module,
  UseGuards,
} from '@nestjs/common';
import {
  Field,
  FieldMiddleware,
  GraphQLModule,
  ObjectType,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ApolloDriver, ApolloDriverConfig } from '../../lib/index.js';

@Injectable()
class StaffGuard implements CanActivate {
  canActivate(): boolean {
    return false;
  }
}

const mask: FieldMiddleware = async (_ctx, next) => {
  const value: string = await next();
  return `**** ${value.slice(-4)}`;
};

// An ordinary (billing) object type named like the root subscription type
@ObjectType()
class Subscription {
  @Field(() => String)
  plan: string;

  @Field(() => String)
  cardNumber: string;
}

@Resolver(() => Subscription)
class SubscriptionResolver {
  @Query(() => Subscription)
  currentSubscription() {
    return { plan: 'pro', cardNumber: '4111111111111111' };
  }

  @UseGuards(StaffGuard)
  @ResolveField(() => String)
  cardNumber(@Parent() subscription: Subscription) {
    return subscription.cardNumber;
  }
}

// An ordinary object type named like the root mutation type
@ObjectType()
class Mutation {
  @Field(() => String)
  patientName: string;
}

@Resolver(() => Mutation)
class MutationResolver {
  @Query(() => Mutation)
  lastMutation() {
    return { patientName: 'stored' };
  }

  @ResolveField(() => String, { middleware: [mask] })
  patientName(@Parent() mutation: Mutation) {
    return `${mutation.patientName} 12345678`;
  }
}

@Module({ providers: [SubscriptionResolver, MutationResolver] })
class BillingModule {}

describe('GraphQL - Object types named like a root type', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        BillingModule,
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          // no "fieldResolverEnhancers": the guard above has to run anyway
        }),
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const query = (query: string) =>
    request(app.getHttpServer()).post('/graphql').send({ query });

  it('should run the guarded field resolver of a type named "Subscription"', async () => {
    const { body } = await query('{ currentSubscription { plan cardNumber } }');

    expect(body.data).toBeNull();
    expect(body.errors[0].message).toBe('Forbidden resource');
  });

  it('should run the field middleware of a type named "Mutation"', async () => {
    const { body } = await query('{ lastMutation { patientName } }');

    expect(body).toEqual({
      data: { lastMutation: { patientName: '**** 5678' } },
    });
  });
});
