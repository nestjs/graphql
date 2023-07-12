import { Expose, Transform } from 'class-transformer';
import { IsString, validate } from 'class-validator';
import { Field, ObjectType } from '../../../lib/decorators';
import { MetadataLoader } from '../../../lib/plugin/metadata-loader';
import { getFieldsAndDecoratorForType } from '../../../lib/schema-builder/utils/get-fields-and-decorator.util';
import { PartialType } from '../../../lib/type-helpers';
import { BaseType } from './fixtures/base-type.fixture';
import { SERIALIZED_METADATA } from './fixtures/serialized-metadata.fixture';
import { getValidationMetadataByTarget } from './type-helpers.test-utils';

@ObjectType()
class CreateUserDto extends BaseType {
  @Field({ nullable: true })
  login: string;

  @Expose()
  @Transform((str) => str + '_transformed')
  @IsString()
  @Field()
  password: string;
}

class UpdateUserDto extends PartialType(CreateUserDto) {}

describe('PartialType', () => {
  const metadataLoader = new MetadataLoader();

  it('should inherit all fields and set "nullable" to true', async () => {
    await metadataLoader.load(SERIALIZED_METADATA);

    const prototype = Object.getPrototypeOf(UpdateUserDto);
    const { fields } = getFieldsAndDecoratorForType(prototype);

    expect(fields.length).toEqual(6);
    expect(fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'id',
          options: { nullable: true },
        }),
        expect.objectContaining({
          name: 'createdAt',
          options: { nullable: true },
        }),
        expect.objectContaining({
          name: 'updatedAt',
          options: { nullable: true },
        }),
        expect.objectContaining({
          name: 'login',
          options: { nullable: true },
        }),
        expect.objectContaining({
          name: 'password',
          options: { nullable: true },
        }),
        expect.objectContaining({
          name: 'meta',
          options: { nullable: true },
        }),
      ]),
    );
    expect(fields[0].directives.length).toEqual(1);
    expect(fields[0].directives).toContainEqual({
      fieldName: 'id',
      sdl: '@upper',
      target: prototype,
    });
    expect(fields[0].extensions).toEqual({
      extension: true,
    });
  });

  describe('Validation metadata', () => {
    it('should inherit metadata', () => {
      const validationKeys = new Set(
        getValidationMetadataByTarget(UpdateUserDto).map(
          (item) => item.propertyName,
        ),
      );
      expect(Array.from(validationKeys)).toEqual([
        'password',
        'id',
        'createdAt',
        'updatedAt',
        'login',
        'meta',
      ]);
    });
    describe('when object does not fulfil validation rules', () => {
      it('"validate" should return validation errors', async () => {
        const updateDto = new UpdateUserDto();
        updateDto.password = 1234567 as any;

        const validationErrors = await validate(updateDto);

        expect(validationErrors.length).toEqual(1);
        expect(validationErrors[0].constraints).toEqual({
          isString: 'password must be a string',
        });
      });
    });
  });
});
