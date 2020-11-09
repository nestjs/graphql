import { Transform } from 'class-transformer';
import { MinLength } from 'class-validator';
import { Field, ObjectType } from '../../lib/decorators';
import { getFieldsAndDecoratorForType } from '../../lib/schema-builder/utils/get-fields-and-decorator.util';
import { PickType } from '../../lib/type-helpers';

describe('PickType', () => {
  @ObjectType()
  class CreateUserDto {
    @Transform((str) => str + '_transformed')
    @MinLength(10)
    @Field({ nullable: true })
    login: string;

    @MinLength(10)
    @Field()
    password: string;

    @Field({ name: 'id' })
    _id: string;
  }

  class UpdateUserDto extends PickType(CreateUserDto, ['login']) {}

  class UpdateUserWithIdDto extends PickType(CreateUserDto, ['_id']) {}

  it('should inherit "login" field', () => {
    const { fields } = getFieldsAndDecoratorForType(
      Object.getPrototypeOf(UpdateUserDto),
    );
    expect(fields.length).toEqual(1);
    expect(fields[0].name).toEqual('login');
  });

  it('should inherit renamed "_id" field', () => {
    const { fields } = getFieldsAndDecoratorForType(
      Object.getPrototypeOf(UpdateUserWithIdDto),
    );
    expect(fields.length).toEqual(1);
    expect(fields[0].name).toEqual('_id');
  });
});
