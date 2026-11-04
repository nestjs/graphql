import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled';
import { INestApplication, Module } from '@nestjs/common';
import {
  Field,
  FieldMiddleware,
  GraphQLModule,
  InterfaceType,
  ObjectType,
  Parent,
  Query,
  ResolveField,
  Resolver,
  UseFieldMiddleware,
} from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '../../lib/index.js';
import { expectSingleResult } from '../utils/assertion-utils.js';

/**
 * Wraps the resolved value with the middleware name, so the response shows
 * the order in which middleware ran (outermost first).
 */
const wrap =
  (name: string): FieldMiddleware =>
  async (_ctx, next) =>
    `${name}(${await next()})`;

@ObjectType()
class Item {
  // Also resolved by "ItemResolver.overridden()".
  @Field({ middleware: [wrap('option')] })
  @UseFieldMiddleware(wrap('decorator'))
  overridden: string;

  @Field({ middleware: [wrap('option')] })
  plain: string;
}

@InterfaceType()
abstract class Document {
  @Field({ middleware: [wrap('document')] })
  owner: string;
}

@ObjectType({ implements: () => [Document] })
class Payslip implements Document {
  @Field({ middleware: [wrap('payslip')] })
  owner: string;
}

@ObjectType({ implements: () => [Document] })
class Memo implements Document {
  owner: string;
}

@Resolver(() => Item)
class ItemResolver {
  @Query(() => Item)
  item(): Item {
    return { overridden: 'value', plain: 'value' };
  }

  @ResolveField()
  @UseFieldMiddleware(wrap('resolver'))
  overridden(@Parent() parent: Item): string {
    return parent.overridden;
  }
}

@Resolver(() => Document)
class DocumentResolver {
  @Query(() => Payslip)
  payslip(): Payslip {
    return { owner: 'value' };
  }

  @Query(() => Memo)
  memo(): Memo {
    return { owner: 'value' };
  }

  @ResolveField(() => String)
  @UseFieldMiddleware(wrap('resolver'))
  owner(@Parent() parent: Document): string {
    return parent.owner;
  }
}

describe.each([
  ['without global middleware', [], (value: string) => value],
  [
    'with global middleware',
    [wrap('global')],
    (value: string) => `global(${value})`,
  ],
])(
  'Federation - field middleware of model fields resolved by field resolvers (%s)',
  (
    _,
    fieldMiddleware: FieldMiddleware[],
    global: (value: string) => string,
  ) => {
    @Module({
      imports: [
        GraphQLModule.forRoot<ApolloFederationDriverConfig>({
          driver: ApolloFederationDriver,
          autoSchemaFile: true,
          buildSchemaOptions: { fieldMiddleware },
          includeStacktraceInErrorResponses: false,
          plugins: [ApolloServerPluginInlineTraceDisabled()],
        }),
      ],
      providers: [ItemResolver, DocumentResolver],
    })
    class FieldMiddlewareFederationModule {}

    let app: INestApplication;
    let apolloClient: ApolloServer;

    beforeAll(async () => {
      const module = await Test.createTestingModule({
        imports: [FieldMiddlewareFederationModule],
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

    it('should keep the middleware of a model field overridden by a field resolver', async () => {
      const response = await apolloClient.executeOperation({
        query: '{ item { overridden plain } }',
      });
      expectSingleResult(response).toEqual({
        item: {
          overridden: global('option(decorator(resolver(value)))'),
          plain: global('option(value)'),
        },
      });
    });

    it('should keep the middleware of a model field overridden by an interface field resolver', async () => {
      const response = await apolloClient.executeOperation({
        query: '{ payslip { owner } memo { owner } }',
      });
      expectSingleResult(response).toEqual({
        payslip: { owner: global('payslip(resolver(value))') },
        memo: { owner: global('document(resolver(value))') },
      });
    });
  },
);
