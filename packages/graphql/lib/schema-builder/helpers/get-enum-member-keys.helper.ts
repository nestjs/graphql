/**
 * Returns the keys of the members of an enum object.
 *
 * Besides its members, the object TypeScript emits for an enum holds a reverse
 * mapping ("value -> name") for every numeric member, and the exports of a
 * namespace merged with the enum (functions, arrays, objects). None of them
 * is a member of the enum.
 */
export function getEnumMemberKeys(enumRef: Record<string, unknown>): string[] {
  return Object.keys(enumRef).filter(
    (key) =>
      !isReverseMappingKey(enumRef, key) && isPrimitiveValue(enumRef[key]),
  );
}

function isReverseMappingKey(
  enumRef: Record<string, unknown>,
  key: string,
): boolean {
  if (!isNaN(parseInt(key, 10))) {
    return true;
  }
  // "Infinity" and "NaN" are reverse mapping keys "parseInt" cannot read, but
  // only a reverse mapping points back to a numeric member named after its key
  const memberName = enumRef[key];
  if (typeof memberName !== 'string') {
    return false;
  }
  const memberValue = enumRef[memberName];
  return typeof memberValue === 'number' && String(memberValue) === key;
}

function isPrimitiveValue(value: unknown): boolean {
  return (
    typeof value !== 'function' && (typeof value !== 'object' || value === null)
  );
}
