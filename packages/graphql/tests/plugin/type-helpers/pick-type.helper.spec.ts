import { validate } from 'class-validator';
import { ArgsType, Field, ObjectType } from '../../../lib/decorators';
import { MetadataLoader } from '../../../lib/plugin/metadata-loader';
import { getFieldsAndDecoratorForType } from '../../../lib/schema-builder/utils/get-fields-and-decorator.util';
import { PickType } from '../../../lib/type-helpers';
import { CreateUserDto } from './fixtures/create-user-dto.fixture';
import { SERIALIZED_METADATA } from './fixtures/serialized-metadata.fixture';
import { getValidationMetadataByTarget } from './type-helpers.test-utils';

class UpdateUserDto extends PickType(CreateUserDto, ['login']) {}

class UpdateUserWithIdDto extends PickType(CreateUserDto, ['_id']) {}

class IsActiveUserDto extends PickType(CreateUserDto, ['active']) {}

describe('PickType', () => {
  const metadataLoader = new MetadataLoader();

  it('should inherit "login" field', () => {
    const prototype = Object.getPrototypeOf(UpdateUserDto);
    const { fields } = getFieldsAndDecoratorForType(prototype);

    expect(fields.length).toEqual(1);
    expect(fields[0].name).toEqual('login');
    expect(fields[0].directives.length).toEqual(1);
    expect(fields[0].directives).toContainEqual({
      fieldName: 'login',
      sdl: '@upper',
      target: prototype,
    });
  });

  it('should inherit "active" field', async () => {
    await metadataLoader.load(SERIALIZED_METADATA);

    const prototype = Object.getPrototypeOf(IsActiveUserDto);
    const { fields } = getFieldsAndDecoratorForType(prototype);

    expect(fields.length).toEqual(1);
    expect(fields[0].name).toEqual('active');
  });

  it('should inherit renamed "_id" field', () => {
    const { fields } = getFieldsAndDecoratorForType(
      Object.getPrototypeOf(UpdateUserWithIdDto),
    );
    expect(fields.length).toEqual(1);
    expect(fields[0].name).toEqual('_id');
    expect(fields[0].extensions).toEqual({ extension: true });
  });

  describe('Validation metadata', () => {
    it('should inherit metadata with "password" property excluded', () => {
      const validationKeys = getValidationMetadataByTarget(UpdateUserDto).map(
        (item) => item.propertyName,
      );
      expect(validationKeys).toEqual(['login']);
    });
    describe('when object does not fulfil validation rules', () => {
      it('"validate" should return validation errors', async () => {
        await metadataLoader.load(SERIALIZED_METADATA);

        const updateDto = new UpdateUserDto();
        updateDto.login = '1234567';

        let validationErrors = await validate(updateDto);
        expect(validationErrors.length).toEqual(1);
        expect(validationErrors[0].constraints).toEqual({
          minLength: 'login must be longer than or equal to 10 characters',
        });

        const isActiveDto = new IsActiveUserDto();
        isActiveDto.active = '1234567' as any;

        validationErrors = await validate(isActiveDto);
        expect(validationErrors.length).toEqual(1);
        expect(validationErrors[0].constraints).toEqual({
          isBoolean: 'active must be a boolean value',
        });
      });
    });
    describe('otherwise', () => {
      it('"validate" should return an empty array', async () => {
        const updateDto = new UpdateUserDto();
        updateDto.login = '1234567891011';
        // @ts-expect-error
        updateDto.password;

        const validationErrors = await validate(updateDto);
        expect(validationErrors.length).toEqual(0);
      });
    });
  });

  @ArgsType()
  class ArgsType1 {
    @Field() a: string;
    @Field() b: string;
    @Field() c: string;
    @Field() d: string;
    @Field() e: string;
    @Field() f: string;
    @Field() g: string;
    @Field() h: string;
  }

  @ObjectType()
  class PickArgsTest1 extends PickType(ArgsType1, ['a', 'c', 'f', 'h']) {}

  it('should inherit: a, c, f, h fields', () => {
    const { fields } = getFieldsAndDecoratorForType(
      Object.getPrototypeOf(PickArgsTest1),
    );
    expect(fields.length).toEqual(4);
    expect(fields[0].name).toEqual('a');
    expect(fields[1].name).toEqual('c');
    expect(fields[2].name).toEqual('f');
    expect(fields[3].name).toEqual('h');
  });
});
