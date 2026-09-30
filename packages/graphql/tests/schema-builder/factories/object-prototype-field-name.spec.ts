import { Test } from '@nestjs/testing';
import { GraphQLSchema, printSchema } from 'graphql';
import {
  Args,
  ArgsType,
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  InputType,
  Query,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib/index.js';

@InputType()
class ProtoMemberFilterInput {
  @Field(() => String, { nullable: true })
  label?: string;
}

// Registered without a matching class-field declaration (as code-generated or
// dynamically registered types do), so the instance has no own property.
Field(() => String, { nullable: true })(
  ProtoMemberFilterInput.prototype,
  'toString',
);
Field(() => String, { nullable: true })(
  ProtoMemberFilterInput.prototype,
  'constructor',
);

@ArgsType()
class ProtoMemberArgs {
  @Field(() => String, { nullable: true })
  label?: string;
}

Field(() => String, { nullable: true })(ProtoMemberArgs.prototype, 'valueOf');

@InputType()
class GetterDefaultInput {
  @Field(() => String, { nullable: true })
  get computed(): string {
    return 'from-getter';
  }
}

@Resolver()
class ProtoMemberResolver {
  @Query(() => String)
  filter(@Args('filter') filter: ProtoMemberFilterInput): string {
    return 'ok';
  }

  @Query(() => String)
  args(@Args() args: ProtoMemberArgs): string {
    return 'ok';
  }

  @Query(() => String)
  getter(@Args('input') input: GetterDefaultInput): string {
    return 'ok';
  }
}

describe('Field named after an Object.prototype member (issue #4161)', () => {
  let schema: GraphQLSchema;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();
    const schemaFactory = moduleRef.get(GraphQLSchemaFactory);
    schema = await schemaFactory.create([ProtoMemberResolver]);
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('should not infer a default value for input type fields', () => {
    const printed = printSchema(schema);
    expect(printed).toContain(`input ProtoMemberFilterInput {
  label: String
  toString: String
  constructor: String
}`);
  });

  it('should not infer a default value for args type fields', () => {
    const printed = printSchema(schema);
    expect(printed).toContain('args(label: String, valueOf: String): String!');
  });

  it('should still infer a default value from a prototype getter', () => {
    const printed = printSchema(schema);
    expect(printed).toContain('computed: String = "from-getter"');
  });
});
