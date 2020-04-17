import { Field, ObjectType } from '../../lib/decorators';
import { METADATA_FACTORY_NAME } from '../../lib/plugin/plugin-constants';
import { getFieldsAndDecoratorForType } from '../../lib/schema-builder/utils/get-fields-and-decorator.util';
import { IntersectionType } from '../../lib/type-helpers';

describe('IntersectionType', () => {
  @ObjectType()
  class ClassA {
    @Field({ nullable: true })
    login: string;

    @Field()
    password: string;
  }

  @ObjectType()
  class ClassB {
    @Field()
    lastName: string;

    firstName?: string;

    static [METADATA_FACTORY_NAME]() {
      return {
        firstName: { nullable: true, type: () => String },
      };
    }
  }

  class UpdateUserDto extends IntersectionType(ClassA, ClassB) {}

  it('should inherit all fields from two types', () => {
    const { fields } = getFieldsAndDecoratorForType(
      Object.getPrototypeOf(UpdateUserDto),
    );
    expect(fields.length).toEqual(4);
    expect(fields[0].name).toEqual('login');
    expect(fields[1].name).toEqual('password');
    expect(fields[2].name).toEqual('lastName');
    expect(fields[3].name).toEqual('firstName');
  });
});
