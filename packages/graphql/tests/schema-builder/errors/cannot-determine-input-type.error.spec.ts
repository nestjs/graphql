import { CannotDetermineInputTypeError } from '../../../lib/schema-builder/errors/cannot-determine-input-type.error';

describe('CannotDetermineInputTypeError', () => {
  class SomeNestedType {}

  it('should produce the generic message when the type is not registered as an object type', () => {
    const error = new CannotDetermineInputTypeError('field', SomeNestedType);

    expect(error.message).toContain('Cannot determine a GraphQL input type');
    expect(error.message).toContain('"SomeNestedType"');
    expect(error.message).toContain('"field"');
  });

  it('should produce a clearer, actionable message when the type is registered as an ObjectType', () => {
    const error = new CannotDetermineInputTypeError(
      'nestedField',
      SomeNestedType,
      true,
    );

    expect(error.message).toContain(
      'Cannot use "SomeNestedType" as a GraphQL input type for the "nestedField" field',
    );
    expect(error.message).toContain('@ObjectType()');
    expect(error.message).toContain('@InputType()');
    expect(error.message).toContain('PartialType(SomeNestedType, InputType)');
  });

  it('should fall back to the generic message when no type reference is provided', () => {
    const error = new CannotDetermineInputTypeError('field', undefined, true);
    expect(error.message).toContain('Cannot determine a GraphQL input type');
  });
});
