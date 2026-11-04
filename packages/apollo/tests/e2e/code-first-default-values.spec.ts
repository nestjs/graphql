import { ApolloServer } from '@apollo/server';
import { INestApplication, Module } from '@nestjs/common';
import {
  Args,
  Field,
  FieldMiddleware,
  GraphQLModule,
  InputType,
  Int,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { ApolloDriver, ApolloDriverConfig } from '../../lib/index.js';
import { expectSingleResult } from '../utils/assertion-utils.js';

const appendStaffComment: FieldMiddleware = async (_, next) => {
  const comments = await next();
  comments.push('staff only');
  return comments;
};

@ObjectType()
class Ticket {
  @Field(() => [String], {
    defaultValue: [],
    middleware: [appendStaffComment],
  })
  comments: string[];
}

@InputType()
class PostFilter {
  @Field(() => Int, { defaultValue: 2 })
  limit: number;

  @Field(() => [String], { defaultValue: [] })
  tags: string[];
}

@Resolver()
class DefaultValuesResolver {
  @Query(() => Ticket)
  ticket() {
    return {};
  }

  @Query(() => Int)
  tagCount(
    @Args('tags', { type: () => [String], defaultValue: [] }) tags: string[],
  ) {
    tags.push('mutated');
    return tags.length;
  }

  @Query(() => String)
  posts(
    @Args('filter', { type: () => PostFilter, defaultValue: {} })
    filter: PostFilter,
  ) {
    filter.tags?.push('mutated');
    return JSON.stringify(filter);
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
    }),
  ],
  providers: [DefaultValuesResolver],
})
class DefaultValuesModule {}

describe('Code-first default values', () => {
  let app: INestApplication;
  let apolloClient: ApolloServer;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [DefaultValuesModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    const graphqlModule = app.get<GraphQLModule<ApolloDriver>>(GraphQLModule);
    apolloClient = graphqlModule.graphQlAdapter?.instance;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should not share an object type field default across requests', async () => {
    for (let i = 0; i < 2; i++) {
      const response = await apolloClient.executeOperation({
        query: '{ ticket { comments } }',
      });
      expectSingleResult(response).toEqual({
        ticket: { comments: ['staff only'] },
      });
    }
  });

  it('should not share an argument default across requests', async () => {
    for (let i = 0; i < 2; i++) {
      const response = await apolloClient.executeOperation({
        query: '{ tagCount }',
      });
      expectSingleResult(response).toEqual({ tagCount: 1 });
    }
  });

  it('should complete an omitted argument default with the input field defaults', async () => {
    for (let i = 0; i < 2; i++) {
      const omitted = await apolloClient.executeOperation({
        query: '{ posts }',
      });
      const explicit = await apolloClient.executeOperation({
        query: '{ posts(filter: {}) }',
      });
      expectSingleResult(omitted).toEqual({
        posts: JSON.stringify({ limit: 2, tags: ['mutated'] }),
      });
      expectSingleResult(explicit).toEqual({
        posts: JSON.stringify({ limit: 2, tags: ['mutated'] }),
      });
    }
  });
});
