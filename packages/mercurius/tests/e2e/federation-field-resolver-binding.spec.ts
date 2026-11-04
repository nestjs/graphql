import { IResolvers } from '@graphql-tools/utils';
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
  FieldMiddleware,
  GraphQLModule,
  ID,
  InterfaceType,
  ObjectType,
  Parent,
  Query,
  ResolveField,
  Resolver,
  UseFieldMiddleware,
} from '@nestjs/graphql';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { MercuriusFederationDriver } from '../../lib/drivers/index.js';
import { MercuriusDriverConfig } from '../../lib/interfaces/mercurius-driver-config.interface.js';

const wrap =
  (name: string): FieldMiddleware =>
  async (_ctx, next) =>
    `${name}(${await next()})`;

@Injectable()
class DenyGuard implements CanActivate {
  canActivate(): boolean {
    throw new ForbiddenException('Forbidden resource');
  }
}

@ObjectType()
class User {
  @Field()
  id: string;
}

@ObjectType()
class Author extends User {
  @Field()
  bio: string;
}

@ObjectType()
class Item {
  // Also resolved by "ItemResolver.overridden()".
  @Field({ middleware: [wrap('model')] })
  overridden: string;
}

@InterfaceType()
abstract class Node {
  @Field()
  owner: string;
}

@InterfaceType({ implements: () => [Node] })
abstract class PrivateNode implements Node {
  @Field()
  owner: string;
}

@ObjectType({ implements: () => [PrivateNode, Node] })
class Invoice implements PrivateNode {
  @Field(() => ID)
  id: string;

  owner: string;
}

@ObjectType()
class Profile {
  @Field()
  id: string;
}

const record = {
  id: '1',
  bio: 'writes books',
  phone: '555-0100',
  overridden: 'value',
  owner: 'alice@example.com',
  secret: 's3cr3t',
};

@Resolver(() => User)
class UsersResolver {
  @Query(() => User)
  user() {
    return record;
  }

  @Query(() => Author)
  author() {
    return record;
  }

  @ResolveField(() => String)
  @UseGuards(DenyGuard)
  phone() {
    return record.phone;
  }
}

@Resolver(() => Item)
class ItemResolver {
  @Query(() => Item)
  item() {
    return record;
  }

  @ResolveField()
  @UseFieldMiddleware(wrap('resolver'))
  overridden(@Parent() item: Item) {
    return item.overridden;
  }
}

@Resolver(() => Node)
class NodeResolver {
  @Query(() => Invoice)
  invoice() {
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

@Resolver(() => Profile)
class ProfileResolver {
  @Query(() => Profile)
  profile() {
    return record;
  }

  // Declared only by a field resolver: "Profile" has no "@Field() secret".
  @ResolveField(() => String)
  secret() {
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
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusFederationDriver,
      autoSchemaFile: true,
      fieldResolverEnhancers: ['guards'],
      buildSchemaOptions: { fieldMiddleware: [wrap('global')] },
      transformResolvers: dropSecretResolver,
    }),
  ],
  providers: [
    UsersResolver,
    ItemResolver,
    NodeResolver,
    PrivateNodeResolver,
    ProfileResolver,
    DenyGuard,
  ],
})
class FieldResolverBindingFederationModule {}

describe('Federation (Mercurius) - binding of the field resolvers', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [FieldResolverBindingFederationModule],
    }).compile();
    app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  async function execute(query: string) {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query });
    return response.body;
  }

  it.each(['user', 'author'])(
    'should apply the guards of a field resolver inherited from the parent type (%s)',
    async (query) => {
      const { data, errors } = await execute(`{ ${query} { phone } }`);
      expect(data).toBeNull();
      expect(errors?.map((error) => error.message)).toEqual([
        'Forbidden resource',
      ]);
    },
  );

  it('should run the global middleware, then the model field middleware, then the field resolver middleware', async () => {
    await expect(execute('{ item { overridden } }')).resolves.toEqual({
      data: { item: { overridden: 'global(model(resolver(value)))' } },
    });
  });

  it('should bind the field resolver of the most specific interface', async () => {
    const { data, errors } = await execute('{ invoice { owner } }');
    expect(data).toBeNull();
    expect(errors?.map((error) => error.message)).toEqual([
      'Forbidden resource',
    ]);
  });

  it('should refuse to resolve a field declared only by a field resolver that is not bound', async () => {
    const { data, errors } = await execute('{ profile { secret } }');
    expect(data).toBeNull();
    expect(errors?.map((error) => error.message)).toEqual([
      'No resolver is bound for field "Profile.secret".',
    ]);
  });
});
