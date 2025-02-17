import { ApolloServer } from '@apollo/server';
import { INestApplication, Module } from '@nestjs/common';
import {
  Args,
  Field,
  GraphQLModule,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { gql } from 'graphql-tag';
import { ApolloDriver, ApolloDriverConfig } from '../../lib';
import { expectSingleResult } from '../utils/assertion-utils';

@InputType()
class MyArgs {
  @Field()
  public myInput: number;
}

@Resolver({ isAbstract: true })
abstract class MyBaseResolver {
  @Query(() => Int)
  public myQuery(): number {
    return 10;
  }

  @Mutation(() => Int)
  public myMutation(
    @Args({ type: () => MyArgs, name: 'input' }) args: MyArgs,
  ): number {
    return args.myInput;
  }
}

@Resolver()
class MyResolver extends MyBaseResolver {}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
    }),
  ],
  providers: [MyResolver],
})
class MyModule {}

describe('code-first with a resolver that uses inheritance', () => {
  let app: INestApplication;
  let apolloClient: ApolloServer;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [MyModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    const graphqlModule = app.get<GraphQLModule<ApolloDriver>>(GraphQLModule);
    apolloClient = graphqlModule.graphQlAdapter?.instance;
  });

  afterEach(async () => {
    await app.close();
  });

  function createTest() {
    it("resolver inherits schema from its' parent class", async () => {
      const mutation = gql`
        mutation MyTest {
          myMutation(input: { myInput: 5 })
        }
      `;
      const response = await apolloClient.executeOperation({
        query: mutation,
      });
      expectSingleResult(response).toEqual({
        myMutation: 5,
      });
    });
  }

  createTest();
  createTest();
});
