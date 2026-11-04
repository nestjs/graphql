import { Test } from '@nestjs/testing';
import {
  graphql,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLSchema,
} from 'graphql';
import {
  Extensions,
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
} from '../../../lib/index.js';

const wrap =
  (name: string): FieldMiddleware =>
  async (_ctx, next) =>
    `${name}(${await next()})`;

@InterfaceType()
abstract class Node {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  createdBy: string;
}

@ObjectType({ implements: () => [Node] })
class Account implements Node {
  id: string;

  @Field({ description: 'account', middleware: [wrap('staffOnly')] })
  createdBy: string;
}

@ObjectType()
class TrialAccount extends Account {
  @Field()
  expires: string;
}

// Lists `Node` again, although `Account` already implements it.
@ObjectType({ implements: () => [Node] })
class PartnerAccount extends Account {
  @Field()
  partner: string;
}

@InterfaceType()
abstract class OwnedNode {
  @Field(() => ID)
  id: string;

  @Field()
  owner: string;
}

@InterfaceType({ implements: () => [OwnedNode] })
abstract class PrivateNode extends OwnedNode {
  @Extensions({ role: 'ADMIN' })
  @Field({ description: 'private', middleware: [wrap('adminOnly')] })
  owner: string;
}

@InterfaceType({ implements: () => [OwnedNode] })
abstract class PrivateFile extends PrivateNode {
  @Field()
  path: string;
}

@ObjectType()
class StoredFile extends PrivateFile {}

@Resolver()
class AccountsResolver {
  @Query(() => TrialAccount)
  trialAccount(): TrialAccount {
    return null;
  }

  @Query(() => PartnerAccount)
  partnerAccount(): PartnerAccount {
    return null;
  }

  @Query(() => StoredFile)
  storedFile(): StoredFile {
    return null;
  }
}

describe('A field the parent type redeclares from an interface the subclass lists again', () => {
  let schema: GraphQLSchema;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();
    schema = await moduleRef
      .get(GraphQLSchemaFactory)
      .create([AccountsResolver], { orphanedTypes: [PrivateFile] });
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('should keep the object type parent declaration', async () => {
    const partnerAccount = schema.getType(
      'PartnerAccount',
    ) as GraphQLObjectType;
    expect(partnerAccount.getFields().createdBy.description).toBe('account');

    const account = () => ({
      id: '1',
      createdBy: 'value',
      expires: 'value',
      partner: 'value',
    });
    const result = await graphql({
      schema,
      source:
        '{ trialAccount { createdBy } partnerAccount { createdBy partner } }',
      rootValue: { trialAccount: account, partnerAccount: account },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      trialAccount: { createdBy: 'staffOnly(value)' },
      partnerAccount: { createdBy: 'staffOnly(value)', partner: 'value' },
    });
  });

  it('should keep the interface type parent declaration', async () => {
    for (const typeName of ['PrivateFile', 'StoredFile']) {
      const owner = (
        schema.getType(typeName) as GraphQLObjectType | GraphQLInterfaceType
      ).getFields().owner;
      expect(owner.description).toBe('private');
      expect(owner.extensions).toMatchObject({ role: 'ADMIN' });
    }

    const result = await graphql({
      schema,
      source: '{ storedFile { owner path } }',
      rootValue: {
        storedFile: () => ({ id: '1', owner: 'value', path: 'value' }),
      },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      storedFile: { owner: 'adminOnly(value)', path: 'value' },
    });
  });
});
