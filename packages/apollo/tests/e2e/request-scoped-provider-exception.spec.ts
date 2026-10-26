import { ApolloDriver, ApolloDriverConfig } from '../../lib/index.js';
import {
  Catch,
  INestApplication,
  Inject,
  Injectable,
  Module,
  Scope,
  UseFilters,
} from '@nestjs/common';
import { APP_FILTER, REQUEST } from '@nestjs/core';
import {
  GqlExceptionFilter,
  GraphQLModule,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { GraphQLError } from 'graphql';
import request from 'supertest';

class ProviderCreationException extends Error {}
class ConstructorException extends Error {}

@Catch(ProviderCreationException)
class GlobalCreationFilter implements GqlExceptionFilter {
  catch() {
    return new GraphQLError('caught by global filter');
  }
}

@Catch(ConstructorException)
class ResolverCreationFilter implements GqlExceptionFilter {
  catch() {
    return new GraphQLError('caught by resolver filter');
  }
}

@Resolver()
class FactoryResolver {
  constructor(@Inject('FAILING_FACTORY') private readonly failing: unknown) {}

  @Query(() => Boolean)
  viaFactory(): boolean {
    return true;
  }
}

@Injectable({ scope: Scope.REQUEST })
class FailingService {
  constructor(@Inject(REQUEST) _req: unknown) {
    throw new ConstructorException('constructor failed');
  }
}

@Resolver()
@UseFilters(ResolverCreationFilter)
class ConstructorResolver {
  constructor(private readonly failing: FailingService) {}

  @Query(() => Boolean)
  viaConstructor(): boolean {
    return true;
  }
}

@Resolver()
class UnfilteredResolver {
  constructor(
    @Inject('UNFILTERED_FACTORY') private readonly failing: unknown,
  ) {}

  @Query(() => Boolean)
  viaUnfiltered(): boolean {
    return true;
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
    }),
  ],
  providers: [
    {
      provide: 'FAILING_FACTORY',
      scope: Scope.REQUEST,
      inject: [REQUEST],
      useFactory: () => {
        throw new ProviderCreationException('factory failed');
      },
    },
    {
      provide: 'UNFILTERED_FACTORY',
      scope: Scope.REQUEST,
      useFactory: () => {
        throw new Error('no filter for this one');
      },
    },
    FailingService,
    UnfilteredResolver,
    FactoryResolver,
    ConstructorResolver,
    { provide: APP_FILTER, useClass: GlobalCreationFilter },
  ],
})
class AppModule {}

describe('Request-scoped provider creation errors (#1069)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('routes a request-scoped factory error through global filters', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ viaFactory }' });
    expect(res.body.data).toBeNull();
    expect(res.body.errors[0].message).toBe('caught by global filter');
  });

  it('routes a request-scoped constructor error through resolver filters', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ viaConstructor }' });
    expect(res.body.data).toBeNull();
    expect(res.body.errors[0].message).toBe('caught by resolver filter');
  });

  it('keeps the original error when no filter matches', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ viaUnfiltered }' });
    expect(res.body.data).toBeNull();
    expect(res.body.errors[0].message).toBe('no filter for this one');
  });
});
