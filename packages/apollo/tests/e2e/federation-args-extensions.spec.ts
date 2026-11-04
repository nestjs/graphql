import { INestApplication, Module } from '@nestjs/common';
import {
  Args,
  ArgsType,
  Extensions,
  Field,
  GraphQLModule,
  GraphQLSchemaHost,
  ObjectType,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { GraphQLObjectType } from 'graphql';
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '../../lib/index.js';

@ArgsType()
class InvoiceFilterArgs {
  @Field({ nullable: true })
  @Extensions({ role: 'admin' })
  includeDeleted?: boolean;
}

@ObjectType()
class Invoice {
  @Field()
  id: string;
}

@Resolver(() => Invoice)
class InvoiceResolver {
  @Query(() => [Invoice])
  invoices(@Args() _filter: InvoiceFilterArgs): Invoice[] {
    return [];
  }

  @ResolveField(() => [Invoice])
  related(@Args() _filter: InvoiceFilterArgs): Invoice[] {
    return [];
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: true,
    }),
  ],
  providers: [InvoiceResolver],
})
class ArgsExtensionsFederationModule {}

describe('Federation - extensions of the fields of an @ArgsType()', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ArgsExtensionsFederationModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should keep the extensions of the arguments in the federated schema', () => {
    const { schema } = app.get(GraphQLSchemaHost);
    const invoice = schema.getType('Invoice') as GraphQLObjectType;

    for (const field of [
      schema.getQueryType().getFields().invoices,
      invoice.getFields().related,
    ]) {
      const [includeDeleted] = field.args;
      expect(includeDeleted.name).toBe('includeDeleted');
      expect(includeDeleted.extensions).toEqual(
        expect.objectContaining({ role: 'admin' }),
      );
    }
  });
});
