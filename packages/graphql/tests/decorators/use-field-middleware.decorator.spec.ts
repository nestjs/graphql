import { Test } from '@nestjs/testing';
import { graphql, GraphQLSchema } from 'graphql';
import {
  Field,
  FieldMiddleware,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  ID,
  InterfaceType,
  ObjectType,
  Query,
  Resolver,
  TypeMetadataStorage,
  UseFieldMiddleware,
} from '../../lib/index.js';
import { getUseFieldMiddleware } from '../../lib/decorators/use-field-middleware.decorator.js';

const wrap =
  (name: string): FieldMiddleware =>
  async (_ctx, next) =>
    `${name}(${await next()})`;

describe('@UseFieldMiddleware decorator', () => {
  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('should collect middleware per member, the lowest decorator first', () => {
    const a = wrap('a');
    const b = wrap('b');
    const c = wrap('c');

    class Target {
      @UseFieldMiddleware(c)
      @UseFieldMiddleware(a, b)
      property: string;

      @UseFieldMiddleware(a)
      method() {}
    }

    expect(getUseFieldMiddleware(Target.prototype, 'property')).toEqual([
      a,
      b,
      c,
    ]);
    expect(getUseFieldMiddleware(Target.prototype, 'method')).toEqual([a]);
    expect(getUseFieldMiddleware(Target.prototype, 'other')).toEqual([]);
  });

  it('should extend inherited middleware without mutating the parent', () => {
    const a = wrap('a');
    const b = wrap('b');

    class Parent {
      @UseFieldMiddleware(a)
      property: string;
    }
    class Child extends Parent {
      @UseFieldMiddleware(b)
      declare property: string;
    }

    expect(getUseFieldMiddleware(Parent.prototype, 'property')).toEqual([a]);
    expect(getUseFieldMiddleware(Child.prototype, 'property')).toEqual([a, b]);
  });

  describe('when building the schema', () => {
    let schema: GraphQLSchema;

    beforeAll(async () => {
      @ObjectType()
      class MiddlewareModel {
        @UseFieldMiddleware(wrap('decorator'))
        @Field({ middleware: [wrap('option')] })
        property: string;

        @Field()
        @UseFieldMiddleware(wrap('getter'))
        get computed(): string {
          return 'value';
        }
      }

      @Resolver(() => MiddlewareModel)
      class MiddlewareModelResolver {
        @Query(() => MiddlewareModel)
        model() {
          return Object.assign(new MiddlewareModel(), { property: 'value' });
        }
      }

      const moduleRef = await Test.createTestingModule({
        imports: [GraphQLSchemaBuilderModule],
      }).compile();
      schema = await moduleRef
        .get(GraphQLSchemaFactory)
        .create([MiddlewareModelResolver], {
          fieldMiddleware: [wrap('global')],
        });
    });

    it('should run global, option and decorator middleware in this order', async () => {
      const result = await graphql({
        schema,
        source: '{ model { property computed } }',
        rootValue: { model: () => ({ property: 'value', computed: 'value' }) },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({
        model: {
          property: 'global(option(decorator(value)))',
          computed: 'global(getter(value))',
        },
      });
    });
  });

  describe('when a class decorates a member it does not declare with @Field()', () => {
    let schema: GraphQLSchema;

    beforeAll(async () => {
      @InterfaceType()
      abstract class Account {
        @Field(() => ID)
        id: string;

        @Field()
        email: string;
      }

      @InterfaceType()
      abstract class CustomerAccount extends Account {
        @UseFieldMiddleware(wrap('customer'))
        declare email: string;
      }

      @ObjectType({ implements: () => [CustomerAccount] })
      class Customer extends CustomerAccount {}

      @ObjectType()
      class VipCustomer extends Customer {
        @UseFieldMiddleware(wrap('vip'))
        declare email: string;
      }

      @ObjectType({ implements: () => [Account] })
      class Guest implements Account {
        id: string;

        @UseFieldMiddleware(wrap('guest'))
        email: string;
      }

      @ObjectType()
      class Person {
        @UseFieldMiddleware(wrap('parent'))
        @Field({ middleware: [wrap('option')] })
        name: string;
      }

      @ObjectType()
      class Employee extends Person {
        @UseFieldMiddleware(wrap('child'))
        declare name: string;
      }

      @Resolver()
      class AccountsResolver {
        @Query(() => Customer)
        customer() {
          return null;
        }

        @Query(() => VipCustomer)
        vipCustomer() {
          return null;
        }

        @Query(() => Guest)
        guest() {
          return null;
        }

        @Query(() => Person)
        person() {
          return null;
        }

        @Query(() => Employee)
        employee() {
          return null;
        }
      }

      const moduleRef = await Test.createTestingModule({
        imports: [GraphQLSchemaBuilderModule],
      }).compile();
      schema = await moduleRef
        .get(GraphQLSchemaFactory)
        .create([AccountsResolver], {
          fieldMiddleware: [wrap('global')],
        });
    });

    it('should extend the middleware of the inherited field', async () => {
      const account = () => ({ id: '1', email: 'value' });
      const person = () => ({ name: 'value' });
      const result = await graphql({
        schema,
        source:
          '{ customer { email } vipCustomer { email } guest { email } person { name } employee { name } }',
        rootValue: {
          customer: account,
          vipCustomer: account,
          guest: account,
          person,
          employee: person,
        },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({
        customer: { email: 'global(customer(value))' },
        vipCustomer: { email: 'global(customer(vip(value)))' },
        guest: { email: 'global(guest(value))' },
        person: { name: 'global(option(parent(value)))' },
        employee: { name: 'global(option(parent(child(value))))' },
      });
    });
  });
});
