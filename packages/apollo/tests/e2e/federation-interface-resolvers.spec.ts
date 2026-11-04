import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled';
import { makeExecutableSchema } from '@graphql-tools/schema';
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
  ID,
  InterfaceType,
  ObjectType,
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

@Injectable()
class DenyGuard implements CanActivate {
  canActivate(): boolean {
    throw new ForbiddenException('Forbidden resource');
  }
}

@InterfaceType()
abstract class Node {
  @Field(() => ID)
  id: string;

  @Field()
  owner: string;
}

@InterfaceType({ implements: () => [Node] })
abstract class PrivateNode implements Node {
  @Field(() => ID)
  id: string;

  @Field()
  owner: string;
}

@InterfaceType({ implements: () => [Node] })
abstract class Tagged implements Node {
  @Field(() => ID)
  id: string;

  @Field()
  owner: string;
}

@ObjectType({ implements: () => [Node, PrivateNode] })
class Payslip implements PrivateNode {
  id: string;
  owner: string;
}

@ObjectType({ implements: () => [PrivateNode, Node] })
class Invoice implements PrivateNode {
  id: string;
  owner: string;
}

@ObjectType({ implements: () => [Node] })
class Document implements Node {
  id: string;
  owner: string;
}

@ObjectType({ implements: () => [PrivateNode] })
class Contract extends Document {}

@ObjectType({ implements: () => [Node, Tagged, PrivateNode] })
class Note implements PrivateNode, Tagged {
  id: string;
  owner: string;
}

@InterfaceType()
abstract class Account {
  @Field(() => ID)
  id: string;

  balance: number;
}

@ObjectType({ implements: () => [Account] })
class SavingsAccount extends Account {
  @Field({
    middleware: [async (_ctx, next) => `masked:${await next()}`],
  })
  label: string;
}

const record = {
  id: '1',
  owner: 'alice@example.com',
  balance: 1234.5,
  label: 'savings',
};

@Resolver(() => Node)
class NodeResolver {
  @Query(() => Payslip)
  payslip() {
    return record;
  }

  @Query(() => Invoice)
  invoice() {
    return record;
  }

  @Query(() => Contract)
  contract() {
    return record;
  }

  @Query(() => Note)
  note() {
    return record;
  }

  @ResolveField(() => String)
  owner() {
    return 'Node';
  }
}

@Resolver(() => PrivateNode)
class PrivateNodeResolver {
  @ResolveField(() => String)
  @UseGuards(DenyGuard)
  owner() {
    return 'PrivateNode';
  }
}

@Resolver(() => Tagged)
class TaggedResolver {
  @ResolveField(() => String)
  owner() {
    return 'Tagged';
  }
}

@Resolver(() => Account)
class AccountResolver {
  @Query(() => [SavingsAccount])
  accounts() {
    return [record];
  }

  @ResolveField(() => Number)
  @UseGuards(DenyGuard)
  balance() {
    return record.balance;
  }
}

const legacySchema = makeExecutableSchema({
  typeDefs: 'type Query { legacyVersion: String }',
  resolvers: { Query: { legacyVersion: () => '1.0' } },
});

describe.each([
  ['without "inheritResolversFromInterfaces"', {}],
  [
    'with "inheritResolversFromInterfaces"',
    { inheritResolversFromInterfaces: true },
  ],
  ['with the "schema" option', { schema: legacySchema }],
])(
  'Federation - code-first field resolvers declared on interfaces (%s)',
  (_, options: Partial<ApolloFederationDriverConfig>) => {
    @Module({
      imports: [
        GraphQLModule.forRoot<ApolloFederationDriverConfig>({
          driver: ApolloFederationDriver,
          autoSchemaFile: true,
          fieldResolverEnhancers: ['guards'],
          includeStacktraceInErrorResponses: false,
          plugins: [ApolloServerPluginInlineTraceDisabled()],
          ...options,
        }),
      ],
      providers: [
        NodeResolver,
        PrivateNodeResolver,
        TaggedResolver,
        AccountResolver,
        DenyGuard,
      ],
    })
    class InterfaceResolversFederationModule {}

    let app: INestApplication;
    let apolloClient: ApolloServer;

    beforeAll(async () => {
      const module = await Test.createTestingModule({
        imports: [InterfaceResolversFederationModule],
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

    it('should apply the guards of an interface field resolver to the implementing types', () =>
      expectForbidden('{ accounts { id balance } }'));

    it.each(['payslip', 'invoice', 'contract'])(
      'should bind the field resolver of the most specific interface, whatever the order of the interfaces (%s)',
      (query) => expectForbidden(`{ ${query} { owner } }`),
    );

    it('should keep the generated resolvers of the fields that have no field resolver', async () => {
      const response = await apolloClient.executeOperation({
        query: '{ payslip { id } accounts { id label } }',
      });
      expectSingleResult(response).toEqual({
        payslip: { id: '1' },
        accounts: [{ id: '1', label: 'masked:savings' }],
      });
    });

    it('should keep the last listed interface when the interfaces are unrelated', async () => {
      // "Tagged" and "PrivateNode" both implement "Node", and neither
      // implements the other: the last listed one wins.
      await expectForbidden('{ note { owner } }');
    });

    if (options.schema) {
      it('should keep the resolvers of the "schema" option', async () => {
        const response = await apolloClient.executeOperation({
          query: '{ legacyVersion }',
        });
        expectSingleResult(response).toEqual({ legacyVersion: '1.0' });
      });
    }
  },
);
