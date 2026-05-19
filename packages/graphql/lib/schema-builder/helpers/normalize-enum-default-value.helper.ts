import { isUndefined } from '@nestjs/common/utils/shared.utils.js';
import { GqlTypeReference } from '../../interfaces/index.js';
import { EnumMetadata } from '../metadata/index.js';

/**
 * Normalizes a `defaultValue` declared on an argument / input field whose
 * type references a `registerEnumType`-registered enum.
 *
 * GraphQL serializes enum default values through the enum's internal value
 * lookup (see `GraphQLEnumType#serialize`), so the library must pass the
 * enum's internal VALUE (not its KEY) as `defaultValue`. When a user writes
 * `defaultValue: 'BOOKS'` for `enum Category { BOOKS = 'books' }`, the
 * produced SDL fails validation with
 * `Enum "Category" cannot represent value: "BOOKS"`.
 *
 * This helper keeps the value untouched whenever it already matches a
 * registered enum value, otherwise it checks whether the supplied string
 * matches an enum KEY and translates it to the matching enum value so
 * `astFromValue` can emit the correct SDL literal.
 *
 * See: https://github.com/nestjs/graphql/issues/3618
 */
export function normalizeEnumDefaultValue<T = unknown>(
  defaultValue: T,
  typeRef: GqlTypeReference | undefined,
  enumsMetadata: EnumMetadata[],
): T {
  if (isUndefined(defaultValue) || defaultValue === null) {
    return defaultValue;
  }
  if (!typeRef || !enumsMetadata?.length) {
    return defaultValue;
  }

  const enumMetadata = enumsMetadata.find((item) => item.ref === typeRef);
  if (!enumMetadata) {
    return defaultValue;
  }

  const enumRef = enumMetadata.ref as Record<string, unknown>;

  if (Array.isArray(defaultValue)) {
    return defaultValue.map((item) =>
      translateEnumValue(item, enumRef),
    ) as unknown as T;
  }
  return translateEnumValue(defaultValue, enumRef) as unknown as T;
}

function translateEnumValue(value: unknown, enumRef: Record<string, unknown>) {
  if (typeof value !== 'string') {
    return value;
  }
  const registeredValues = getEnumMemberValues(enumRef);
  if (registeredValues.includes(value)) {
    return value;
  }
  if (Object.prototype.hasOwnProperty.call(enumRef, value)) {
    const translated = enumRef[value];
    if (registeredValues.includes(translated)) {
      return translated;
    }
  }
  return value;
}

function getEnumMemberValues(enumRef: Record<string, unknown>): unknown[] {
  const keys = Object.keys(enumRef).filter((key) => isNaN(parseInt(key, 10)));
  return keys.map((key) => enumRef[key]);
}
