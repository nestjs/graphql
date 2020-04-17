import { Expose, Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { Field, ObjectType } from '../../lib/decorators';
import { getFieldsAndDecoratorForType } from '../../lib/schema-builder/utils/get-fields-and-decorator.util';
import { PartialType } from '../../lib/type-helpers';

describe('PartialType', () => {
  @ObjectType()
  class CreateUserDto {
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
    const { fields } = getFieldsAndDecoratorForType(
      Object.getPrototypeOf(UpdateUserDto),
    );
    expect(fields.length).toEqual(2);
    expect(fields[0].name).toEqual('login');
    expect(fields[0].options.nullable).toBeTruthy();
    expect(fields[1].name).toEqual('password');
    expect(fields[1].options.nullable).toBeTruthy();
  });
});
