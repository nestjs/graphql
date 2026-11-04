import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled';
import assert from 'assert';
import {
  CanActivate,
  INestApplication,
  Injectable,
  Module,
  UseGuards,
} from '@nestjs/common';
import {
  Field,
  GraphQLModule,
  ID,
  Int,
  InterfaceType,
  ObjectType,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { gql } from 'graphql-tag';
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '../../lib/index.js';

@Injectable()
class DenyGuard implements CanActivate {
  canActivate(): boolean {
    return false;
  }
}

@InterfaceType()
abstract class Person {
  @Field(() => ID)
  id: string;

  salary: number;
}

@ObjectType({ implements: () => [Person] })
class Employee implements Person {
  id: string;
  salary: number;

  @Field()
  department: string;
}

@ObjectType()
class User {
  @Field(() => ID)
  id: string;

  @Field()
  displayName: string;

  email: string;
  name: string;
}

@Resolver(() => Person)
class PersonResolver {
  @UseGuards(DenyGuard)
  @ResolveField(() => Int)
  salary(@Parent() person: Person) {
    return person.salary;
  }
}

@Resolver(() => Employee)
class EmployeeResolver {
  @Query(() => Employee)
  employee(): Employee {
    return { id: '1', salary: 61000, department: 'R&D' };
  }
}

@Resolver(() => User)
class UserResolver {
  @Query(() => User)
  user(): Omit<User, 'displayName'> {
    return { id: '1', email: 'alice@example.com', name: 'alice' };
  }

  @UseGuards(DenyGuard)
  @ResolveField(() => String)
  email(@Parent() user: User) {
    return user.email;
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: true,
      fieldResolverEnhancers: ['guards'],
      resolvers: {
        User: {
          displayName: (user: User) => user.name.toUpperCase(),
        },
      },
      includeStacktraceInErrorResponses: false,
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    }),
  ],
  providers: [PersonResolver, EmployeeResolver, UserResolver],
})
class FieldResolverGuardsFederationModule {}

describe('Federation - guards of field resolvers', () => {
  let app: INestApplication;
  let apolloClient: ApolloServer;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FieldResolverGuardsFederationModule],
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

  async function execute(query: string) {
    const response = await apolloClient.executeOperation({ query: gql(query) });
    assert(response.body.kind === 'single');
    return response.body.singleResult;
  }

  it('should run the guards of an interface field resolver on implementing types', async () => {
    const result = await execute(`{ employee { department salary } }`);
    expect(result.data).toBeNull();
    expect(result.errors?.[0].message).toBe('Forbidden resource');
  });

  it('should keep guarded field resolvers of a type named in the "resolvers" option', async () => {
    const result = await execute(`{ user { email } }`);
    expect(result.data).toBeNull();
    expect(result.errors?.[0].message).toBe('Forbidden resource');
  });

  it('should apply the "resolvers" option to the same type', async () => {
    const result = await execute(`{ user { displayName } }`);
    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({ user: { displayName: 'ALICE' } });
  });
});
