import { ApolloServer } from '@apollo/server';
import { mergeResolvers } from '@graphql-tools/merge';
import { IResolvers } from '@graphql-tools/utils';
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
  GraphQLModule,
  ObjectType,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import assert from 'assert';
import { ApolloDriver, ApolloDriverConfig } from '../../lib/index.js';
import { expectSingleResult } from '../utils/assertion-utils.js';

@Injectable()
class DenyGuard implements CanActivate {
  canActivate(): boolean {
    throw new ForbiddenException('Forbidden resource');
  }
}

@ObjectType()
class Member {
  @Field()
  name: string;

  @Field()
  displayName: string;
}

const member = { name: 'alice', email: 'alice@example.com' };

@Resolver(() => Member)
class MemberResolver {
  @Query(() => Member)
  member() {
    return member;
  }

  @ResolveField(() => String)
  @UseGuards(DenyGuard)
  email() {
    return member.email;
  }
}

describe.each([
  ['an array', (resolvers: IResolvers | IResolvers[]) => resolvers],
  [
    'a single map',
    (resolvers: IResolvers | IResolvers[]) =>
      mergeResolvers([resolvers].flat()),
  ],
])(
  'code-first "resolvers" option for a type that has field resolvers (transformResolvers returns %s)',
  (_, transformResolvers) => {
    @Module({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          fieldResolverEnhancers: ['guards'],
          transformResolvers,
          resolvers: {
            Member: {
              displayName: (parent: typeof member) => parent.name.toUpperCase(),
            },
          },
        }),
      ],
      providers: [MemberResolver, DenyGuard],
    })
    class ResolversOptionModule {}

    let app: INestApplication;
    let apolloClient: ApolloServer;

    beforeAll(async () => {
      const module = await Test.createTestingModule({
        imports: [ResolversOptionModule],
      }).compile();
      app = module.createNestApplication();
      await app.init();
      const graphqlModule = app.get<GraphQLModule<ApolloDriver>>(GraphQLModule);
      apolloClient = graphqlModule.graphQlAdapter?.instance;
    });

    afterAll(async () => {
      await app.close();
    });

    it('should apply the resolvers of the option', async () => {
      const response = await apolloClient.executeOperation({
        query: '{ member { displayName } }',
      });
      expectSingleResult(response).toEqual({
        member: { displayName: 'ALICE' },
      });
    });

    it('should keep the guarded field resolvers of the type', async () => {
      const response = await apolloClient.executeOperation({
        query: '{ member { email } }',
      });
      assert(response.body.kind === 'single');
      const { data, errors } = response.body.singleResult;
      expect(data).toBeNull();
      expect(errors?.map((error) => error.message)).toEqual([
        'Forbidden resource',
      ]);
    });
  },
);
