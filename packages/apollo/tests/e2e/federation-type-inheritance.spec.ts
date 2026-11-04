import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled';
import {
  CanActivate,
  ForbiddenException,
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
import assert from 'assert';
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '../../lib/index.js';
import { expectSingleResult } from '../utils/assertion-utils.js';

const wrap =
  (name: string): FieldMiddleware =>
  async (_ctx, next) =>
    `${name}(${await next()})`;

@ObjectType()
class User {
  @Field()
  id: string;

  // Also resolved by "UsersResolver.nickname()".
  @Field({ middleware: [wrap('model')] })
  nickname: string;
}

@ObjectType()
class Author extends User {
  @Field()
  bio: string;
}

@ObjectType()
class StarAuthor extends Author {
  @Field()
  stars: number;
}

@ObjectType()
class Editor extends User {
  @Field()
  desk: string;
}

const ada = {
  id: '1',
  nickname: 'ada',
  bio: 'writes books',
  stars: 3,
  desk: 'A1',
  email: 'ada@example.com',
  ssn: '000-00-0000',
  phone: '555-0100',
};

@Injectable()
class DenyGuard implements CanActivate {
  canActivate(): boolean {
    throw new ForbiddenException('Forbidden resource');
  }
}

@Resolver(() => User)
class UsersResolver {
  @Query(() => User)
  user(): User {
    return ada;
  }

  @Query(() => Author)
  author(): Author {
    return ada;
  }

  @Query(() => StarAuthor)
  starAuthor(): StarAuthor {
    return ada;
  }

  @Query(() => Editor)
  editor(): Editor {
    return ada;
  }

  @ResolveField(() => String)
  email(@Parent() user: typeof ada): string {
    return `user:${user.email}`;
  }

  @ResolveField(() => String, {
    middleware: [
      () => {
        throw new ForbiddenException('Forbidden resource');
      },
    ],
  })
  ssn(): string {
    return ada.ssn;
  }

  @ResolveField(() => String)
  @UseGuards(DenyGuard)
  phone(): string {
    return ada.phone;
  }

  @ResolveField()
  nickname(@Parent() user: typeof ada): string {
    return `resolver:${user.nickname}`;
  }
}

@Resolver(() => Author)
class AuthorsResolver {
  @ResolveField(() => String)
  email(@Parent() author: typeof ada): string {
    return `author:${author.email}`;
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: true,
      fieldResolverEnhancers: ['guards'],
      includeStacktraceInErrorResponses: false,
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    }),
  ],
  providers: [UsersResolver, AuthorsResolver, DenyGuard],
})
class TypeInheritanceFederationModule {}

describe('Federation - code-first object types that use inheritance', () => {
  let app: INestApplication;
  let apolloClient: ApolloServer;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [TypeInheritanceFederationModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    const graphqlModule =
      app.get<GraphQLModule<ApolloFederationDriver>>(GraphQLModule);
    apolloClient = graphqlModule.graphQlAdapter?.instance;
  });

  afterAll(async () => {
    await app.close();
  });

  async function expectForbidden(query: string) {
    const response = await apolloClient.executeOperation({ query });
    assert(response.body.kind === 'single');
    const { data, errors } = response.body.singleResult;
    expect(data).toBeNull();
    expect(errors?.map((error) => error.message)).toEqual([
      'Forbidden resource',
    ]);
  }

  it('should bind the field resolvers of the parent type to its subtypes (nearest ancestor wins)', async () => {
    const response = await apolloClient.executeOperation({
      query: `{
        user { email }
        author { email }
        starAuthor { email }
        editor { email }
      }`,
    });
    expectSingleResult(response).toEqual({
      user: { email: 'user:ada@example.com' },
      author: { email: 'author:ada@example.com' },
      starAuthor: { email: 'author:ada@example.com' },
      editor: { email: 'user:ada@example.com' },
    });
  });

  it.each(['user', 'author', 'starAuthor', 'editor'])(
    'should apply the field middleware of the inherited field resolver (%s)',
    (query) => expectForbidden(`{ ${query} { ssn } }`),
  );

  it.each(['user', 'author', 'starAuthor', 'editor'])(
    'should apply the guards of the inherited field resolver (%s)',
    (query) => expectForbidden(`{ ${query} { phone } }`),
  );

  it('should run the model field middleware once around the inherited field resolver', async () => {
    const response = await apolloClient.executeOperation({
      query: `{
        user { nickname }
        author { nickname }
        starAuthor { nickname }
        editor { nickname }
      }`,
    });
    const nickname = { nickname: 'model(resolver:ada)' };
    expectSingleResult(response).toEqual({
      user: nickname,
      author: nickname,
      starAuthor: nickname,
      editor: nickname,
    });
  });
});
