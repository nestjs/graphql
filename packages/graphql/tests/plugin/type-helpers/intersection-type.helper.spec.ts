import {
  Directive,
  Extensions,
  Field,
  IntersectionType,
  ObjectType,
} from '../../../lib';
import { METADATA_FACTORY_NAME } from '../../../lib/plugin/plugin-constants';
import { getFieldsAndDecoratorForType } from '../../../lib/schema-builder/utils/get-fields-and-decorator.util';

describe('IntersectionType', () => {
  @ObjectType()
  class ClassA {
    @Field({ nullable: true })
    @Directive('@upper')
    @Extensions({ extension: true })
    login: string;

    @Field()
    password: string;
  }

  @ObjectType()
  class ClassB {
    @Field()
    @Directive('@upper')
    @Extensions({ extension: true })
    lastName: string;

    firstName?: string;

    @Field(() => [String])
    hobbies?: string[];

    static [METADATA_FACTORY_NAME]() {
      return {
        firstName: { nullable: true, type: () => String },
      };
    }
  }

  class UpdateUserDto extends IntersectionType(ClassA, ClassB) {}

  it('should inherit all fields from two types', () => {
    const prototype = Object.getPrototypeOf(UpdateUserDto);
    const { fields } = getFieldsAndDecoratorForType(prototype);
    const [
      loginField,
      passwordField,
      lastNameField,
      hobbiesField,
      firstNameField,
    ] = fields;
    expect(fields.length).toEqual(5);
    expect(loginField.name).toEqual('login');
    expect(passwordField.name).toEqual('password');
    expect(lastNameField.name).toEqual('lastName');
    expect(hobbiesField.name).toEqual('hobbies');
    expect(hobbiesField.options).toEqual({ isArray: true, arrayDepth: 1 });
    expect(firstNameField.name).toEqual('firstName');
    expect(loginField.directives.length).toEqual(1);
    expect(loginField.directives).toContainEqual({
      fieldName: 'login',
      sdl: '@upper',
      target: prototype,
    });
    expect(loginField.extensions).toEqual({
      extension: true,
    });
    expect(lastNameField.directives.length).toEqual(1);
    expect(lastNameField.directives).toContainEqual({
      fieldName: 'lastName',
      sdl: '@upper',
      target: prototype,
    });
    expect(lastNameField.extensions).toEqual({
      extension: true,
    });
  });
});
