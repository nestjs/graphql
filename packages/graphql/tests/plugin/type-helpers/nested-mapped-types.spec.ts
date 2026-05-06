import { MetadataLoader } from '../../../lib/plugin/metadata-loader.js';
import { getFieldsAndDecoratorForType } from '../../../lib/schema-builder/utils/get-fields-and-decorator.util.js';
import {
  IntersectionType,
  OmitType,
  PartialType,
  PickType,
} from '../../../lib/type-helpers/index.js';
import { CreateUserDto } from './fixtures/create-user-dto.fixture.js';
import { SERIALIZED_METADATA } from './fixtures/serialized-metadata.fixture.js';

// Regression coverage for issue #3313 — when mapped type helpers are nested
// (e.g. PartialType(OmitType(...))) the SWC plugin's metadata refresh hooks
// must run from the innermost wrapper outwards so plugin-only fields
// (those declared without a `@Field()` decorator and emitted via
// `metadata.ts`) get propagated through every wrapper.

class PartialOmitUserDto extends PartialType(
  OmitType(CreateUserDto, ['login']),
) {}

class PartialPickUserDto extends PartialType(
  PickType(CreateUserDto, ['active', 'password']),
) {}

class IntersectionPickUserDto extends IntersectionType(
  PickType(CreateUserDto, ['active']),
  PickType(CreateUserDto, ['login']),
) {}

describe('Nested mapped types (issue #3313)', () => {
  const metadataLoader = new MetadataLoader();

  beforeAll(async () => {
    await metadataLoader.load(SERIALIZED_METADATA);
  });

  it('should propagate plugin-only fields through PartialType(OmitType(...))', () => {
    const prototype = Object.getPrototypeOf(PartialOmitUserDto);
    const { fields } = getFieldsAndDecoratorForType(prototype);

    const fieldNames = fields.map((f) => f.name).sort();
    // CreateUserDto fields: login, password, _id, active. After OmitType
    // strips "login" and PartialType nullablises everything we should still
    // see "active" (which is plugin-only) propagated through.
    expect(fieldNames).toEqual(['_id', 'active', 'password']);
    const active = fields.find((f) => f.name === 'active');
    expect(active).toBeDefined();
    expect(active?.options.nullable).toEqual(true);
  });

  it('should propagate plugin-only fields through PartialType(PickType(...))', () => {
    const prototype = Object.getPrototypeOf(PartialPickUserDto);
    const { fields } = getFieldsAndDecoratorForType(prototype);

    const fieldNames = fields.map((f) => f.name).sort();
    expect(fieldNames).toEqual(['active', 'password']);
    expect(fields.every((f) => f.options.nullable === true)).toBe(true);
  });

  it('should propagate plugin-only fields through IntersectionType(PickType(...), PickType(...))', () => {
    const prototype = Object.getPrototypeOf(IntersectionPickUserDto);
    const { fields } = getFieldsAndDecoratorForType(prototype);

    const fieldNames = fields.map((f) => f.name).sort();
    expect(fieldNames).toEqual(['active', 'login']);
  });
});
