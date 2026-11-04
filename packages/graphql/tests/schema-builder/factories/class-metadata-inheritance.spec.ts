import { Test } from '@nestjs/testing';
import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import {
  Directive,
  Extensions,
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  ObjectType,
  PartialType,
  Query,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib/index.js';

@Extensions({ role: 'ADMIN' })
@ObjectType()
class Invoice {
  @Field()
  iban: string;
}

@ObjectType()
class CreditNote extends Invoice {
  @Field()
  reason: string;
}

@Extensions({ role: 'ADMIN', audited: true })
@ObjectType({ isAbstract: true })
abstract class InternalRecord {
  @Field()
  createdBy: string;
}

@Extensions({ role: 'AUDITOR' })
@ObjectType()
class AuditEntry extends InternalRecord {
  @Field()
  action: string;
}

@Directive('@first')
@Directive('@second')
@Directive(['@third', '@fourth'])
@Extensions({ access: 'PUBLIC' })
@Extensions({ access: 'ADMIN' })
@ObjectType()
class Stacked {
  @Field()
  id: string;
}

@Extensions({ access: 'PUBLIC' })
@Extensions({ access: 'ADMIN' })
@ObjectType()
class MappedStacked {
  @Field()
  id: string;
}

@ObjectType()
class PartialMappedStacked extends PartialType(MappedStacked) {}

@Resolver()
class SampleResolver {
  @Query(() => Invoice)
  invoice(): Invoice {
    return null;
  }

  @Query(() => CreditNote)
  creditNote(): CreditNote {
    return null;
  }

  @Query(() => AuditEntry)
  auditEntry(): AuditEntry {
    return null;
  }

  @Query(() => Stacked)
  stacked(): Stacked {
    return null;
  }

  @Query(() => MappedStacked)
  mappedStacked(): MappedStacked {
    return null;
  }

  @Query(() => PartialMappedStacked)
  partialMappedStacked(): PartialMappedStacked {
    return null;
  }
}

describe('Class-level @Extensions() and @Directive()', () => {
  let schemaFactory: GraphQLSchemaFactory;

  const getType = (schema: GraphQLSchema, name: string) =>
    schema.getType(name) as GraphQLObjectType;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();

    schemaFactory = moduleRef.get(GraphQLSchemaFactory);
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('should inherit class-level extensions, letting the subclass override a key', async () => {
    const schema = await schemaFactory.create([SampleResolver]);

    expect(getType(schema, 'Invoice').extensions).toEqual({ role: 'ADMIN' });
    expect(getType(schema, 'CreditNote').extensions).toEqual({
      role: 'ADMIN',
    });
    expect(getType(schema, 'AuditEntry').extensions).toEqual({
      role: 'AUDITOR',
      audited: true,
    });
  });

  it('should keep stacked class directives and extensions in source order in every schema', async () => {
    for (let build = 0; build < 2; build++) {
      const schema = await schemaFactory.create([SampleResolver]);
      const stacked = getType(schema, 'Stacked');

      expect(
        stacked.astNode?.directives?.map((directive) => directive.name.value),
      ).toEqual(['first', 'second', 'third', 'fourth']);
      // The decorator closest to the class is applied last.
      expect(stacked.extensions).toEqual({ access: 'ADMIN' });
      expect(getType(schema, 'MappedStacked').extensions).toEqual({
        access: 'ADMIN',
      });
    }
  });
});
