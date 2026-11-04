import { Test } from '@nestjs/testing';
import { graphql, GraphQLSchema } from 'graphql';
import {
  Args,
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  InputType,
  Int,
  Query,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib/index.js';
import {
  cloneDefaultValue,
  isolateDefaultValues,
} from '../../../lib/schema-builder/helpers/clone-default-value.helper.js';
import { completeDefaultValues } from '../../../lib/schema-builder/helpers/complete-default-values.helper.js';

@InputType()
class CreateChannelInput {
  @Field()
  name: string;

  @Field(() => [String])
  members: string[] = [];
}

@InputType()
class PostFilter {
  @Field({ defaultValue: 'published' })
  status: string;

  @Field(() => Int, { defaultValue: 2 })
  limit: number;
}

@Resolver()
class DefaultValuesResolver {
  @Query(() => String)
  createChannel(
    @Args('input') input: CreateChannelInput,
    @Args('tags', { type: () => [String], defaultValue: [] }) tags: string[],
  ): string {
    return 'ok';
  }

  @Query(() => String)
  posts(
    @Args('filter', { type: () => PostFilter, defaultValue: {} })
    filter: PostFilter,
  ): string {
    return 'ok';
  }
}

describe('Default value helpers', () => {
  let schemaFactory: GraphQLSchemaFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();
    schemaFactory = moduleRef.get(GraphQLSchemaFactory);
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  const execute = async (schema: GraphQLSchema, source: string) => {
    const rootValue = {
      createChannel: ({ input, tags }) => {
        input.members.push('creator');
        tags.push('new');
        return JSON.stringify({ members: input.members, tags });
      },
      posts: ({ filter }) => JSON.stringify(filter),
    };
    const { data, errors } = await graphql({ schema, source, rootValue });
    expect(errors).toBeUndefined();
    return data;
  };

  describe('cloneDefaultValue', () => {
    it('should copy plain arrays and objects only', () => {
      class Money {
        constructor(public amount: number) {}
      }
      const money = new Money(5);
      const value = { tags: ['a'], nested: { money }, date: new Date(0) };
      const copy = cloneDefaultValue(value);

      expect(copy).toEqual(value);
      expect(copy).not.toBe(value);
      expect(copy.tags).not.toBe(value.tags);
      expect(copy.nested).not.toBe(value.nested);
      expect(copy.nested.money).toBe(money);
      expect(copy.date).toBe(value.date);
    });
  });

  describe('isolateDefaultValues', () => {
    it('should give every operation its own copy of an array default', async () => {
      const schema = isolateDefaultValues(
        await schemaFactory.create([DefaultValuesResolver]),
      );
      const query = '{ createChannel(input: { name: "lobby" }) }';

      expect(await execute(schema, query)).toEqual({
        createChannel: JSON.stringify({ members: ['creator'], tags: ['new'] }),
      });
      expect(await execute(schema, query)).toEqual({
        createChannel: JSON.stringify({ members: ['creator'], tags: ['new'] }),
      });
    });
  });

  describe('completeDefaultValues', () => {
    it('should complete an argument default with the input field defaults', async () => {
      const schema = completeDefaultValues(
        await schemaFactory.create([DefaultValuesResolver]),
      );
      const expected = {
        posts: JSON.stringify({ status: 'published', limit: 2 }),
      };

      expect(await execute(schema, '{ posts }')).toEqual(expected);
      expect(await execute(schema, '{ posts(filter: {}) }')).toEqual(expected);
    });
  });
});
