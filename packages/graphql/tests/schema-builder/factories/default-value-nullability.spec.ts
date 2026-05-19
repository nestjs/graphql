/**
 * Regression test for issue #1511:
 * `defaultValue` should NOT affect field nullability.
 *
 * GraphQL treats these as independent concerns:
 *   String! = "guest"  → non-null, omittable (uses default), null rejected
 *   String  = "guest"  → nullable, omittable (uses default), null accepted
 *
 * Spring Boot analogy:
 *   @NotNull + @Schema(defaultValue="guest") → still @NotNull, just has a default
 *   Removing @NotNull is a separate decision from adding defaultValue
 */

import { Test } from '@nestjs/testing';
import { printSchema, GraphQLNonNull } from 'graphql';
import {
  Args,
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  InputType,
  Query,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib';

// ── Scenario A: non-null field + defaultValue ─────────────────────────────────
// User did NOT set nullable:true. Field should stay String! (non-null with default).
// Expected SDL: name: String! = "guest"
@InputType('ScalarNonNullInput')
class ScalarNonNullInput {
  @Field(() => String, { defaultValue: 'guest' })
  name!: string;
}

// ── Scenario B: nullable field + defaultValue ─────────────────────────────────
// User explicitly set nullable:true. Field should be String = "guest" (no !).
@InputType('ScalarNullableInput')
class ScalarNullableInput {
  @Field(() => String, { defaultValue: 'guest', nullable: true })
  name!: string;
}

// ── Scenario C: array with nullable:'items' + defaultValue ────────────────────
// nullable:'items' means → list is non-null ([T]!), items inside are nullable
// This is valid GraphQL: `tags: [String]! = ["default"]`
// Regression: previously threw DefaultNullableConflictError (issue #1511).
@InputType('ArrayItemsNullableInput')
class ArrayItemsNullableInput {
  @Field(() => [String], { defaultValue: ['default'], nullable: 'items' })
  tags!: string[];
}

// ── Resolvers ─────────────────────────────────────────────────────────────────
@Resolver()
class ScalarResolver {
  @Query(() => String)
  pingNonNull(
    @Args('a', { type: () => ScalarNonNullInput }) _a: ScalarNonNullInput,
  ): string {
    return 'pong';
  }

  @Query(() => String)
  pingNullable(
    @Args('b', { type: () => ScalarNullableInput }) _b: ScalarNullableInput,
  ): string {
    return 'pong';
  }
}

@Resolver()
class ArrayResolver {
  @Query(() => String)
  pingArray(
    @Args('c', { type: () => ArrayItemsNullableInput })
    _c: ArrayItemsNullableInput,
  ): string {
    return 'pong';
  }
}

// ─────────────────────────────────────────────────────────────────────────────

describe('defaultValue + nullable independence (issue #1511)', () => {
  // One shared afterAll for the whole file so metadata lives long enough
  // for all nested beforeAll blocks to run.
  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  // ── Scenarios A & B share one schema ────────────────────────────────────────
  describe('scalar fields', () => {
    let schemaFactory: GraphQLSchemaFactory;

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [GraphQLSchemaBuilderModule],
      }).compile();
      schemaFactory = moduleRef.get(GraphQLSchemaFactory);
    });

    describe('non-null field with defaultValue (Scenario A)', () => {
      it('should generate String! in SDL — not String', async () => {
        // This test verifies the CORE claim of issue #1511:
        // defaultValue must not strip the NonNull wrapper.
        const schema = await schemaFactory.create([ScalarResolver]);
        const printed = printSchema(schema);
        expect(printed).toContain('name: String! = "guest"');
      });

      it('resolved field type should be GraphQLNonNull', async () => {
        const schema = await schemaFactory.create([ScalarResolver]);
        const type: any = schema.getTypeMap()['ScalarNonNullInput'];
        expect(type).toBeDefined();
        expect(type.getFields().name.type).toBeInstanceOf(GraphQLNonNull);
      });

      it('defaultValue is preserved on the resolved field', async () => {
        const schema = await schemaFactory.create([ScalarResolver]);
        const type: any = schema.getTypeMap()['ScalarNonNullInput'];
        expect(type.getFields().name.defaultValue).toBe('guest');
      });
    });

    describe('nullable field with defaultValue (Scenario B)', () => {
      it('should generate String (no !) in SDL when nullable:true', async () => {
        const schema = await schemaFactory.create([ScalarResolver]);
        const printed = printSchema(schema);
        expect(printed).toContain('name: String = "guest"');
      });

      it('resolved field type should NOT be GraphQLNonNull', async () => {
        const schema = await schemaFactory.create([ScalarResolver]);
        const type: any = schema.getTypeMap()['ScalarNullableInput'];
        expect(type).toBeDefined();
        expect(type.getFields().name.type).not.toBeInstanceOf(GraphQLNonNull);
      });
    });
  });

  // ── Scenario C: array with nullable:'items' + defaultValue ──────────────────
  describe('array field: nullable:items + defaultValue (Scenario C)', () => {
    it('should NOT throw — [String]! = ["default"] is valid GraphQL', async () => {
      // In GraphQL, a non-null list with nullable items CAN have a defaultValue:
      //   tags: [String]! = ["default"]
      // Previously NestJS threw DefaultNullableConflictError for this (issue #1511).
      const moduleRef = await Test.createTestingModule({
        imports: [GraphQLSchemaBuilderModule],
      }).compile();
      const factory = moduleRef.get(GraphQLSchemaFactory);

      await expect(factory.create([ArrayResolver])).resolves.toBeDefined();
    });
  });
});
