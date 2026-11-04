import { Test } from '@nestjs/testing';
import {
  Args,
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  ID,
  InputType,
  Query,
  Resolver,
  TypeMetadataStorage,
} from '../../lib/index.js';
import { createArgsMapper } from '../../lib/utils/map-args-to-props.util.js';

@InputType()
class PostsFilterInput {
  @Field(() => String, { name: 'author', nullable: true })
  authorId?: string;
}

@InputType()
class DeletePostsInput extends PostsFilterInput {
  @Field(() => ID)
  authorId: string;
}

@InputType()
class AddressInput {
  @Field({ name: 'zip_code' })
  zipCode: string;
}

@InputType()
class IntlAddressInput extends AddressInput {
  @Field({ name: 'country_code', nullable: true })
  countryCode?: string;
}

@InputType()
class ShipmentInput {
  @Field(() => AddressInput)
  address: AddressInput;
}

@InputType()
class IntlShipmentInput extends ShipmentInput {
  @Field(() => IntlAddressInput)
  declare address: IntlAddressInput;
}

@Resolver()
class PostsResolver {
  @Query(() => String)
  deletePosts(@Args('input') input: DeletePostsInput): string {
    return 'ok';
  }

  @Query(() => String)
  ship(@Args('input') input: IntlShipmentInput): string {
    return 'ok';
  }
}

describe('createArgsMapper', () => {
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();
    await moduleRef.get(GraphQLSchemaFactory).create([PostsResolver]);
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('should not map an inherited rename over a re-declared property', () => {
    const mapArgs = createArgsMapper(PostsResolver, 'deletePosts');
    expect(mapArgs({ input: { authorId: '42', author: null } })).toEqual({
      input: { authorId: '42', author: null },
    });
  });

  it('should map a re-declared nested input type with its own renames', () => {
    const mapArgs = createArgsMapper(PostsResolver, 'ship');
    expect(
      mapArgs({
        input: { address: { zip_code: '10115', country_code: 'DE' } },
      }),
    ).toEqual({
      input: { address: { zipCode: '10115', countryCode: 'DE' } },
    });
  });
});
