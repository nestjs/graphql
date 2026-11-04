import { applyDecorators } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GraphQLObjectType, printType } from 'graphql';
import {
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  HideField,
  ObjectType,
  Query,
  Resolver,
} from '../../lib/index.js';
import { METADATA_FACTORY_NAME } from '../../lib/plugin/plugin-constants.js';

// A composed decorator the CLI plugin cannot see through
const Internal = () => applyDecorators(HideField());

// Shaped like a class compiled with the CLI plugin, which (not seeing through
// "Internal") still lists "resetToken" in the metadata factory.
@ObjectType()
class Account {
  @Field()
  email: string;

  @Internal()
  resetToken: string;

  static [METADATA_FACTORY_NAME]() {
    return {
      email: { type: () => String },
      resetToken: { type: () => String },
    };
  }
}

@Resolver(() => Account)
class AccountResolver {
  @Query(() => Account)
  account(): Account {
    return { email: 'alice@example.com', resetToken: 'secret' };
  }
}

describe('HideField', () => {
  it('should keep a member hidden through a composed decorator, even when the plugin lists it', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();
    const schema = await moduleRef
      .get(GraphQLSchemaFactory)
      .create([AccountResolver]);

    const accountType = schema.getType('Account') as GraphQLObjectType;
    expect(Object.keys(accountType.getFields())).toEqual(['email']);
    expect(printType(accountType)).not.toContain('resetToken');
  });
});
