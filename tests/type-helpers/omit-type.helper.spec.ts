import { Transform } from 'class-transformer';
import { MinLength } from 'class-validator';
import { Field, ObjectType } from '../../lib/decorators';
import { getFieldsAndDecoratorForType } from '../../lib/schema-builder/utils/get-fields-and-decorator.util';
import { OmitType } from '../../lib/type-helpers';

describe('OmitType', () => {
  @ObjectType()
  class CreateUserDto {
    @MinLength(10)
    @Field({ nullable: true })
    login: string;

    @Transform((str) => str + '_transformed')
    @MinLength(10)
    @Field()
    password: string;

    @Field({ name: 'id' })
    _id: string;
  }

  class UpdateUserDto extends OmitType(CreateUserDto, ['login', '_id']) {}

  it('should inherit all fields except for "login" and "_id"', () => {
    const { fields } = getFieldsAndDecoratorForType(
      Object.getPrototypeOf(UpdateUserDto),
    );
    expect(fields.length).toEqual(1);
    expect(fields[0].name).toEqual('password');
  });
});
