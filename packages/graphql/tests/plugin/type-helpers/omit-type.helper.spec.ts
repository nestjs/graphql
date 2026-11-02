import { IsNumber } from 'class-validator';
import { Field, ObjectType } from '../../../lib/decorators/index.js';
import { getFieldsAndDecoratorForType } from '../../../lib/schema-builder/utils/get-fields-and-decorator.util.js';
import { OmitType } from '../../../lib/type-helpers/index.js';
import { CreateUserDto } from './fixtures/create-user-dto.fixture.js';
import { getValidationMetadataByTarget } from './type-helpers.test-utils.js';

describe('OmitType', () => {
  class UpdateUserDto extends OmitType(CreateUserDto, ['login', '_id']) {}

  it('should inherit all fields except for "login" and "_id"', () => {
    const prototype = Object.getPrototypeOf(UpdateUserDto);
    const { fields } = getFieldsAndDecoratorForType(prototype);
    expect(fields.length).toEqual(1);
    expect(fields[0].name).toEqual('password');
    expect(fields[0].directives.length).toEqual(1);
    expect(fields[0].directives).toContainEqual({
      fieldName: 'password',
      sdl: '@upper',
      target: prototype,
    });
    expect(fields[0].extensions).toEqual({
      extension: true,
    });
  });
  it('should handle a field whose key is a number', () => {
    @ObjectType()
    class PricesDto {
      @IsNumber()
      @Field({ name: 'basePrice' })
      0: number;

      @IsNumber()
      @Field({ name: 'costPrice' })
      1: number;
    }
    class PublicPricesDto extends OmitType(PricesDto, [1]) {}

    const { fields } = getFieldsAndDecoratorForType(
      Object.getPrototypeOf(PublicPricesDto),
    );
    expect(fields.map((field) => field.name)).toEqual(['0']);
    expect(
      getValidationMetadataByTarget(PublicPricesDto).map(
        (item) => item.propertyName,
      ),
    ).toEqual(['0']);
  });
});
