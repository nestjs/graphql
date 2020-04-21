import { Expose, Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { Field, ObjectType } from '../../lib/decorators';
import { getFieldsAndDecoratorForType } from '../../lib/schema-builder/utils/get-fields-and-decorator.util';
import { PartialType } from '../../lib/type-helpers';

describe('PartialType', () => {
  @ObjectType({ isAbstract: true })
  abstract class BaseType {
    @Field()
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
    const { fields } = getFieldsAndDecoratorForType(
      Object.getPrototypeOf(UpdateUserDto),
    );

    expect(fields.length).toEqual(5);
    expect(fields).toEqual(
      jasmine.arrayContaining([
        jasmine.objectContaining({
          name: 'id',
          options: { nullable: true },
        }),
        jasmine.objectContaining({
          name: 'createdAt',
          options: { nullable: true },
        }),
        jasmine.objectContaining({
          name: 'updatedAt',
          options: { nullable: true },
        }),
        jasmine.objectContaining({
          name: 'login',
          options: { nullable: true },
        }),
        jasmine.objectContaining({
          name: 'password',
          options: { nullable: true },
        }),
      ]),
    );
  });
});
