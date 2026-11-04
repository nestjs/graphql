import { Test } from '@nestjs/testing';
import { GraphQLSchema } from 'graphql';
import {
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  ObjectType,
  Query,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib/index.js';

@ObjectType()
class AuditEntry {
  @Field()
  id!: string;
}

@ObjectType()
class Account {
  @Field()
  id!: string;
}

@Resolver()
class AdminResolver {
  @Query(() => AuditEntry)
  lastAuditEntry(): AuditEntry {
    return { id: '1' };
  }
}

@Resolver()
class PublicResolver {
  @Query(() => Account)
  me(): Account {
    return { id: '1' };
  }
}

describe('Orphaned references with multiple schemas', () => {
  let adminSchema: GraphQLSchema;
  let publicSchema: GraphQLSchema;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();
    const schemaFactory = moduleRef.get(GraphQLSchemaFactory);

    adminSchema = await schemaFactory.create([AdminResolver]);
    publicSchema = await schemaFactory.create([PublicResolver]);
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('should not carry references over to the next schema', () => {
    expect(adminSchema.getType('AuditEntry')).toBeDefined();
    expect(publicSchema.getType('Account')).toBeDefined();
    expect(publicSchema.getType('AuditEntry')).toBeUndefined();
  });
});
