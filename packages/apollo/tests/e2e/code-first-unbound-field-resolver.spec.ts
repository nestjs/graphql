import { ApolloServer } from '@apollo/server';
import { IResolvers } from '@graphql-tools/utils';
import { INestApplication, Module } from '@nestjs/common';
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
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      transformResolvers: dropSecretResolver,
    }),
  ],
  providers: [ProfileResolver],
})
class UnboundFieldResolverModule {}

describe('code-first field declared by a field resolver that is not bound', () => {
  let app: INestApplication;
  let apolloClient: ApolloServer;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [UnboundFieldResolverModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    const graphqlModule = app.get<GraphQLModule<ApolloDriver>>(GraphQLModule);
    apolloClient = graphqlModule.graphQlAdapter?.instance;
  });

  afterAll(async () => {
    await app.close();
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
