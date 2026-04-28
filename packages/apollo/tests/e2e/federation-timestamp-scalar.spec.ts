import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled';
import assert from 'assert';
import { INestApplication, Module } from '@nestjs/common';
import {
  Field,
  GraphQLModule,
  ID,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { gql } from 'graphql-tag';
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '../../lib';

@ObjectType()
class Reading {
  @Field(() => ID)
  id: string;

  @Field()
  capturedAt: Date;
}

@Resolver(() => Reading)
class ReadingResolver {
  @Query(() => Reading)
  reading(): Reading {
    const r = new Reading();
    r.id = '1';
    r.capturedAt = new Date(0);
    return r;
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: true,
      buildSchemaOptions: { dateScalarMode: 'timestamp' },
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    }),
  ],
  providers: [ReadingResolver],
})
class TimestampFederationModule {}

describe('Federation - Timestamp scalar (dateScalarMode: "timestamp")', () => {
  let app: INestApplication;
  let apolloClient: ApolloServer;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TimestampFederationModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const graphqlModule =
      app.get<GraphQLModule<ApolloFederationDriver>>(GraphQLModule);
    apolloClient = graphqlModule.graphQlAdapter?.instance;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should serialize a Date field through the Timestamp scalar in the federated schema', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          reading {
            id
            capturedAt
          }
        }
      `,
    });
    assert(response.body.kind === 'single');
    expect(response.body.singleResult.errors).toBeUndefined();
    const data = response.body.singleResult.data as {
      reading: { id: string; capturedAt: number };
    };
    expect(data.reading.id).toBe('1');
    expect(data.reading.capturedAt).toBe(0);
  });
});
