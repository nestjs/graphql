import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled';
import { IResolvers } from '@graphql-tools/utils';
import { INestApplication, Logger, Module } from '@nestjs/common';
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
import { vi } from 'vitest';
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '../../lib/index.js';
import { expectSingleResult } from '../utils/assertion-utils.js';

@ObjectType()
class Profile {
  @Field()
  id: string;

  @Field()
  nickname: string;
}

const profile = {
  id: '1',
  nickname: 'ada',
  secret: 's3cr3t',
  masked: 's3cr3t',
};

@Resolver(() => Profile)
class ProfileResolver {
  @Query(() => Profile)
  profile() {
    return profile;
  }

  // Declared only by a field resolver: "Profile" has no "@Field() secret".
  @ResolveField(() => String)
  secret() {
    return '******';
  }

  @ResolveField(() => String)
  masked() {
    return '******';
  }
}

/**
 * Drops the "Profile.secret" field resolver from the discovered resolvers.
 */
function dropSecretResolver(resolvers: IResolvers | IResolvers[]) {
  return ([] as IResolvers[]).concat(resolvers).map((typeResolvers) => {
    if (!typeResolvers.Profile) {
      return typeResolvers;
    }
    const { secret, ...profileResolvers } = typeResolvers.Profile as Record<
      string,
      unknown
    >;
    return { ...typeResolvers, Profile: profileResolvers } as IResolvers;
  });
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: true,
      transformResolvers: dropSecretResolver,
      includeStacktraceInErrorResponses: false,
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    }),
  ],
  providers: [ProfileResolver],
})
class UnboundFieldResolverFederationModule {}

describe('Federation - code-first field declared by a field resolver that is not bound', () => {
  let app: INestApplication;
  let apolloClient: ApolloServer;
  const warnings: string[] = [];

  beforeAll(async () => {
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation((message: string) => {
        warnings.push(message);
      });
    try {
      const module = await Test.createTestingModule({
        imports: [UnboundFieldResolverFederationModule],
      }).compile();
      app = module.createNestApplication();
      await app.init();
    } finally {
      warn.mockRestore();
    }
    const graphqlModule =
      app.get<GraphQLModule<ApolloFederationDriver>>(GraphQLModule);
    apolloClient = graphqlModule.graphQlAdapter?.instance;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should warn at startup about the field', () => {
    expect(warnings).toContainEqual(
      expect.stringContaining(
        'No resolver is bound for these fields, which are declared only by a field resolver (@ResolveField()): "Profile.secret".',
      ),
    );
  });

  it('should refuse to resolve the field instead of reading the parent property', async () => {
    const response = await apolloClient.executeOperation({
      query: '{ profile { id secret } }',
    });
    assert(response.body.kind === 'single');
    const { data, errors } = response.body.singleResult;
    expect(data).toBeNull();
    expect(errors?.map((error) => error.message)).toEqual([
      'No resolver is bound for field "Profile.secret".',
    ]);
  });

  it('should still resolve the other fields', async () => {
    const response = await apolloClient.executeOperation({
      query: '{ profile { id nickname masked } }',
    });
    expectSingleResult(response).toEqual({
      profile: { id: '1', nickname: 'ada', masked: '******' },
    });
  });
});
