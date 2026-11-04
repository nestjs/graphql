import { Test } from '@nestjs/testing';
import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import {
  Args,
  Field,
  Float,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  ID,
  ObjectType,
  Query,
  ResolveField,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib/index.js';

/**
 * The resolvers explorer binds a handler on the type of the resolver class Nest
 * instantiates, and reads it from that instance's prototype, so the most
 * derived declaration of a method is the one that runs. The schema has to be
 * generated from the same resolver class and the same declaration.
 */

@ObjectType({ isAbstract: true })
abstract class BaseEntity {
  @Field(() => ID)
  id: string;

  createdBy: string;
}

@ObjectType()
class Comment extends BaseEntity {
  @Field()
  text: string;
}

@ObjectType()
class Article extends BaseEntity {
  @Field()
  title: string;

  @Field(() => [Comment])
  comments: Comment[];
}

@ObjectType()
class Note extends BaseEntity {
  @Field()
  body: string;
}

@Resolver(() => BaseEntity, { isAbstract: true })
abstract class BaseEntityResolver {
  @ResolveField(() => String)
  createdBy(): string {
    return 'admin';
  }
}

@Resolver(() => Article)
class ArticleResolver extends BaseEntityResolver {
  @Query(() => Article)
  article(): Article {
    return null;
  }
}

@Resolver('Note')
class NoteResolver extends BaseEntityResolver {
  @Query(() => Note)
  note(): Note {
    return null;
  }
}

@ObjectType()
class Order {
  @Field(() => ID)
  id: string;
}

@Resolver(() => Order, { isAbstract: true })
abstract class BaseOrderResolver {
  @ResolveField(() => Float)
  total(
    @Args('currency', { type: () => String, nullable: true }) currency?: string,
  ): number {
    return 0;
  }

  @ResolveField(() => String)
  internalNote(): string {
    return 'internal';
  }
}

@Resolver(() => Order)
class OrderResolver extends BaseOrderResolver {
  @Query(() => Order)
  order(): Order {
    return null;
  }

  @ResolveField(() => Float)
  override total(
    @Args('currency', { type: () => String }) currency: string,
  ): number {
    return 1;
  }

  // Overridden without re-declaring the field: the explorer binds nothing.
  override internalNote(): string {
    return 'overridden';
  }
}

@Resolver({ isAbstract: true })
abstract class ListResolver {
  @Query(() => String)
  products(
    @Args('tenant', { type: () => String, nullable: true }) tenant?: string,
  ): string {
    return tenant;
  }
}

@Resolver({ isAbstract: true })
abstract class TenantListResolver extends ListResolver {
  @Query(() => String)
  override products(
    @Args('tenant', { type: () => String }) tenant: string,
  ): string {
    return tenant;
  }
}

@Resolver()
class ProductsResolver extends TenantListResolver {}

@Resolver()
class UsersResolver {
  @Query(() => [String])
  users(): string[] {
    return [];
  }
}

@Resolver()
class AdminUsersResolver extends UsersResolver {
  @Query(() => [String], { name: 'allUsers' })
  override users(): string[] {
    return [];
  }
}

describe('TypeMetadataStorage - @ResolveField() host and overrides', () => {
  let schema: GraphQLSchema;

  const getFields = (typeName: string) =>
    (schema.getType(typeName) as GraphQLObjectType).getFields();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();

    schema = await moduleRef
      .get(GraphQLSchemaFactory)
      .create(
        [
          ArticleResolver,
          NoteResolver,
          OrderResolver,
          ProductsResolver,
          UsersResolver,
          AdminUsersResolver,
        ],
        { skipCheck: true },
      );
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('should add an inherited handler to the type of the resolver that serves it', () => {
    expect(getFields('Article').createdBy).toBeDefined();
    expect(getFields('Comment').createdBy).toBeUndefined();
  });

  it('should resolve the host of a resolver typed by name', () => {
    expect(getFields('Note').createdBy).toBeDefined();
  });

  it('should generate an overridden field resolver from the overriding declaration', () => {
    const currency = getFields('Order').total.args.find(
      (arg) => arg.name === 'currency',
    );
    expect(currency?.type.toString()).toBe('String!');
  });

  it('should drop a field resolver overridden without the decorator', () => {
    expect(getFields('Order').internalNote).toBeUndefined();
  });

  it('should generate an overridden query from the overriding declaration', () => {
    const tenant = getFields('Query').products.args.find(
      (arg) => arg.name === 'tenant',
    );
    expect(tenant?.type.toString()).toBe('String!');
  });

  it('should keep a base resolver query that the base resolver serves itself', () => {
    expect(getFields('Query').users).toBeDefined();
    expect(getFields('Query').allUsers).toBeDefined();
  });
});
