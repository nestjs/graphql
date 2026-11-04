import { Test } from '@nestjs/testing';
import {
  GraphQLField,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  getNamedType,
} from 'graphql';
import {
  Args,
  Directive,
  Extensions,
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  ID,
  InputType,
  Int,
  InterfaceType,
  Mutation,
  ObjectType,
  Query,
  ResolveField,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib/index.js';

/**
 * A `@ResolveField()` handler is merged into the field its host type declares
 * (on the type itself, an ancestor class or an implemented interface). The
 * handler's metadata has to reach the host type's field, and only that one:
 * the declaration it is merged into is shared with every other type that
 * inherits it.
 */

@ObjectType()
class User {
  @Field(() => ID)
  id: string;

  @Directive('@cacheControl(maxAge: 60)')
  @Field()
  email: string;

  @Field()
  phone: string;

  @Field()
  status: string;
}

@Resolver(() => User)
class UserResolver {
  @Query(() => User)
  user(): User {
    return null;
  }

  @Directive('@auth(requires: "ADMIN")')
  @ResolveField(() => String)
  email() {
    return 'email';
  }

  @Extensions({ role: 'ADMIN' })
  @ResolveField(() => String)
  phone() {
    return 'phone';
  }

  @ResolveField('status', undefined, {
    nullable: true,
    description: 'handler description',
  })
  getStatus() {
    return null;
  }
}

@InterfaceType()
abstract class Account {
  @Field(() => ID)
  id: string;

  @Extensions({ role: 'ADMIN' })
  @Directive('@auth')
  @Field()
  email: string;
}

@ObjectType({ implements: () => [Account] })
class Customer implements Account {
  id: string;
  email: string;
}

@ObjectType({ implements: () => [Account] })
class Employee implements Account {
  id: string;
  email: string;
}

@Resolver(() => Employee)
class EmployeeResolver {
  @Query(() => [Account])
  accounts(): Account[] {
    return [];
  }

  @Query(() => Customer)
  customer(): Customer {
    return null;
  }

  @ResolveField(() => String)
  email() {
    return 'email';
  }
}

@InterfaceType()
abstract class Document {
  @Field(() => ID)
  id: string;

  @Field()
  body: string;
}

@ObjectType({ implements: () => [Document] })
class Memo extends Document {}

@ObjectType({ implements: () => [Document] })
class Report extends Document {}

@Resolver(() => Memo)
class MemoResolver {
  @Query(() => [Document])
  documents(): Document[] {
    return [];
  }

  @ResolveField(() => String)
  body(
    @Args('template', { type: () => String, nullable: true })
    template?: string,
  ) {
    return template;
  }
}

@Resolver(() => Report)
class ReportResolver {
  @Query(() => Report)
  report(): Report {
    return null;
  }

  @ResolveField(() => String)
  body(
    @Args('template', { type: () => Int, defaultValue: 1 })
    template: number,
  ) {
    return String(template);
  }
}

@ObjectType()
class Author {
  @Field(() => ID)
  id: string;
}

@ObjectType()
@InputType('PostInput')
class Post {
  @Field()
  text: string;

  @Field(() => ID, { name: 'authorId' })
  author: string;
}

@Resolver(() => Post)
class PostResolver {
  @Query(() => Post)
  post(): Post {
    return null;
  }

  @Mutation(() => Post)
  createPost(@Args('input') input: Post): Post {
    return input;
  }

  @ResolveField(() => Author, { nullable: true })
  author() {
    return null;
  }
}

describe('TypeMetadataStorage - @ResolveField() merged into a declared field', () => {
  let schema: GraphQLSchema;

  const getField = (typeName: string, fieldName: string) =>
    (
      schema.getType(typeName) as GraphQLObjectType | GraphQLInterfaceType
    ).getFields()[fieldName];
  const getDirectiveNames = (field: GraphQLField<unknown, unknown>) =>
    field.astNode?.directives?.map((directive) => directive.name.value) ?? [];
  const getArg = (field: GraphQLField<unknown, unknown>, name: string) =>
    field.args.find((arg) => arg.name === name);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();

    schema = await moduleRef
      .get(GraphQLSchemaFactory)
      .create(
        [
          UserResolver,
          EmployeeResolver,
          MemoResolver,
          ReportResolver,
          PostResolver,
        ],
        { skipCheck: true },
      );
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it("should keep the handler's directives next to the model's", () => {
    expect(getDirectiveNames(getField('User', 'email'))).toEqual([
      'cacheControl',
      'auth',
    ]);
  });

  it("should apply the handler's extensions to a field the model declares", () => {
    expect(getField('User', 'phone').extensions).toEqual(
      expect.objectContaining({ role: 'ADMIN' }),
    );
  });

  it("should apply the handler's nullability and description over the model's", () => {
    const field = getField('User', 'status');

    expect(field.type).not.toBeInstanceOf(GraphQLNonNull);
    expect(field.description).toBe('handler description');
  });

  it("should keep an interface field's extensions and directives on an implementing type with a handler", () => {
    const employeeEmail = getField('Employee', 'email');

    expect(employeeEmail.extensions).toEqual(
      expect.objectContaining({ role: 'ADMIN' }),
    );
    expect(getDirectiveNames(employeeEmail)).toEqual(['auth']);
    expect(getField('Customer', 'email').extensions).toEqual(
      expect.objectContaining({ role: 'ADMIN' }),
    );
  });

  it("should publish each implementing type's own handler arguments, leaving the interface field alone", () => {
    expect(getField('Document', 'body').args).toEqual([]);

    const memoTemplate = getArg(getField('Memo', 'body'), 'template');
    expect(memoTemplate?.type.toString()).toBe('String');

    const reportTemplate = getArg(getField('Report', 'body'), 'template');
    expect(reportTemplate?.type.toString()).toBe('Int!');
    expect(reportTemplate?.defaultValue).toBe(1);
  });

  it("should not merge a handler's options into a model property of the same name exposed under another name", () => {
    const postInput = schema.getType('PostInput') as GraphQLInputObjectType;
    expect(postInput.getFields().authorId.type).toBeInstanceOf(GraphQLNonNull);

    expect(getField('Post', 'authorId').type).toBeInstanceOf(GraphQLNonNull);
    const author = getField('Post', 'author');
    expect(author.type).not.toBeInstanceOf(GraphQLNonNull);
    expect(getNamedType(author.type).name).toBe('Author');
  });
});
