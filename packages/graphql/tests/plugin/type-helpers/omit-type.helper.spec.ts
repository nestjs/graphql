import { getFieldsAndDecoratorForType } from '../../../lib/schema-builder/utils/get-fields-and-decorator.util.js';
import { OmitType } from '../../../lib/type-helpers/index.js';
import { CreateUserDto } from './fixtures/create-user-dto.fixture.js';

describe('OmitType', () => {
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
