import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import { INestApplication, Module } from '@nestjs/common';
import {
  Directive,
  Field,
  GraphQLModule,
  ID,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import {
  buildSchema,
  defaultFieldResolver,
  DirectiveLocation,
  GraphQLDirective,
  GraphQLSchema,
} from 'graphql';
import request from 'supertest';
import {
  MercuriusDriver,
  MercuriusDriverConfig,
  MercuriusFederationDriver,
} from '../../lib/index.js';

// Lets only the "admin" caller resolve the fields marked with "@admin"
function adminDirectiveTransformer(schema: GraphQLSchema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      if (!getDirective(schema, fieldConfig, 'admin')?.[0]) {
        return fieldConfig;
      }
      const { resolve = defaultFieldResolver } = fieldConfig;
      fieldConfig.resolve = (source, args, context, info) => {
        if (context.req.headers.authorization !== 'admin') {
          throw new Error('admins only');
        }
        return resolve(source, args, context, info);
      };
      return fieldConfig;
    },
  });
}

const adminDirective = new GraphQLDirective({
  name: 'admin',
  locations: [DirectiveLocation.FIELD_DEFINITION],
});

@ObjectType()
class User {
  @Field(() => ID)
  id: string;

  @Directive('@admin')
  @Field(() => [String])
  payments: string[];

  @Field(() => [String])
  invoices: string[];
}

@Resolver(() => User)
class UsersResolver {
  @Query(() => User)
  user() {
    return { id: '1' };
  }
}

describe('Mercurius loaders and "resolvers" with "transformSchema"', () => {
  let app: INestApplication;

  const bootstrap = async (
    options: MercuriusDriverConfig,
    providers: any[] = [],
  ) => {
    @Module({
      imports: [GraphQLModule.forRoot<MercuriusDriverConfig>(options)],
      providers,
    })
    class AppModule {}

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  };

  const query = (source: string, authorization = 'anonymous') =>
    request(app.getHttpServer())
      .post('/graphql')
      .set('authorization', authorization)
      .send({ query: source });

  afterEach(async () => {
    await app?.close();
  });

  describe.each([
    ['MercuriusDriver', MercuriusDriver],
    ['MercuriusFederationDriver', MercuriusFederationDriver],
  ])('with fields resolved by loaders (%s)', (_, driver) => {
    beforeEach(() =>
      bootstrap(
        {
          driver,
          autoSchemaFile: true,
          buildSchemaOptions: { directives: [adminDirective] },
          transformSchema: adminDirectiveTransformer,
          loaders: {
            User: {
              payments: async (queries) =>
                queries.map(({ obj }) => [`payment of user ${obj.id}`]),
              invoices: async (queries) =>
                queries.map(({ obj }) => [`invoice of user ${obj.id}`]),
            },
          },
        },
        [UsersResolver],
      ),
    );

    it('should apply the "transformSchema" wrappers to them', async () => {
      const res = await query('{ user { payments } }');
      expect(res.body.data).toBeNull();
      expect(res.body.errors).toEqual([
        expect.objectContaining({ message: 'admins only' }),
      ]);

      await query('{ user { payments } }', 'admin').expect(200, {
        data: { user: { payments: ['payment of user 1'] } },
      });
    });

    it('should resolve them through the loaders', async () => {
      await query('{ user { id invoices } }').expect(200, {
        data: { user: { id: '1', invoices: ['invoice of user 1'] } },
      });
    });
  });

  describe.each([
    ['MercuriusDriver', MercuriusDriver],
    ['MercuriusFederationDriver', MercuriusFederationDriver],
  ])('with fields resolved by the "resolvers" option (%s)', (_, driver) => {
    it('should keep the "transformSchema" wrappers of the generated schema', async () => {
      await bootstrap({
        driver,
        typeDefs: `
          directive @admin on FIELD_DEFINITION
          type Query {
            auditLog: String @admin
            hello: String
          }
        `,
        resolvers: {
          Query: {
            auditLog: () => 'audit log',
            hello: () => 'world',
          },
        },
        transformSchema: adminDirectiveTransformer,
      });

      const res = await query('{ auditLog }');
      expect(res.body.data).toEqual({ auditLog: null });
      expect(res.body.errors).toEqual([
        expect.objectContaining({ message: 'admins only' }),
      ]);
      await query('{ hello }').expect(200, { data: { hello: 'world' } });
    });
  });

  it('should still apply the "resolvers" option to a ready-made "schema"', async () => {
    await bootstrap({
      driver: MercuriusDriver,
      schema: buildSchema('type Query { hello: String }'),
      resolvers: { Query: { hello: () => 'world' } },
    });

    await query('{ hello }').expect(200, { data: { hello: 'world' } });
  });
});
