import { Transform } from 'class-transformer';
import { MinLength } from 'class-validator';
import {
  Directive,
  Extensions,
  Field,
  ObjectType,
} from '../../../lib/decorators';
import { getFieldsAndDecoratorForType } from '../../../lib/schema-builder/utils/get-fields-and-decorator.util';
import { OmitType } from '../../../lib/type-helpers';

describe('OmitType', () => {
  @ObjectType()
  class CreateUserDto {
    @MinLength(10)
    @Field({ nullable: true })
    login: string;

    @Transform((str) => str + '_transformed')
    @MinLength(10)
    @Field()
    @Directive('@upper')
    @Extensions({ extension: true })
    password: string;

    @Field({ name: 'id' })
    _id: string;
  }

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
});
