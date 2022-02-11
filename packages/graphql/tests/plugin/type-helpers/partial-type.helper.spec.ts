import { Expose, Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import {
  Directive,
  Extensions,
  Field,
  ObjectType,
} from '../../../lib/decorators';
import { getFieldsAndDecoratorForType } from '../../../lib/schema-builder/utils/get-fields-and-decorator.util';
import { PartialType } from '../../../lib/type-helpers';

describe('PartialType', () => {
  @ObjectType({ isAbstract: true })
  abstract class BaseType {
    @Field()
    @Directive('@upper')
    @Extensions({ extension: true })
    id: string;

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
  }

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

  it('should inherit all fields and set "nullable" to true', () => {
    const prototype = Object.getPrototypeOf(UpdateUserDto);
    const { fields } = getFieldsAndDecoratorForType(prototype);

    expect(fields.length).toEqual(5);
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
});
