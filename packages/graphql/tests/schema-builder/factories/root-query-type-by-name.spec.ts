import { Test } from '@nestjs/testing';
import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  printSchema,
} from 'graphql';
import {
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  Mutation,
  ObjectType,
  Query,
  ResolveField,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib';

@ObjectType()
class RenamePayload {
  @Field()
  name!: string;

  @Field(() => 'Query')
  query!: object;
}

@ObjectType()
class DeletePayload {
  @Field()
  deleted!: boolean;
}

@Resolver()
class AccountResolver {
  @Query(() => String)
  name(): string {
    return 'name';
  }

  @Mutation(() => RenamePayload)
  rename(): RenamePayload {
    return { name: 'name', query: {} };
  }

  @Mutation(() => DeletePayload)
  delete(): DeletePayload {
    return { deleted: true };
  }
}

@Resolver(() => DeletePayload)
class DeletePayloadResolver {
  @ResolveField(() => 'Query', { nullable: true })
  query(): object {
    return {};
  }
}

describe('Root Query type referenced by name', () => {
  let schema: GraphQLSchema;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();

    schema = await moduleRef
      .get(GraphQLSchemaFactory)
      .create([AccountResolver, DeletePayloadResolver]);
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('prints the payload fields that return the root Query type', () => {
    const printedSchema = printSchema(schema);
    expect(printedSchema).toContain(
      'type RenamePayload {\n  name: String!\n  query: Query!\n}',
    );
    expect(printedSchema).toContain(
      'type DeletePayload {\n  deleted: Boolean!\n  query: Query\n}',
    );
  });

  it('points the fields at the generated root Query type', () => {
    const renameQueryField = (
      schema.getType('RenamePayload') as GraphQLObjectType
    ).getFields().query;
    const deleteQueryField = (
      schema.getType('DeletePayload') as GraphQLObjectType
    ).getFields().query;

    expect(
      (renameQueryField.type as GraphQLNonNull<GraphQLObjectType>).ofType,
    ).toBe(schema.getQueryType());
    expect(deleteQueryField.type).toBe(schema.getQueryType());
  });
});
