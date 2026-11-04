interface InheritableField {
  name: string;
  schemaName: string;
}

/**
 * Merges the fields declared along a class hierarchy, given farthest ancestor
 * first (the class itself last), the way a subclass overrides what it
 * inherits: the nearest declaration of a property wins, and so does the
 * nearest declaration of a schema name.
 *
 * A field an ancestor declares is therefore dropped when a nearer class
 * re-declares the same property (under any schema name, e.g., after
 * `@Field({ name })`), or declares another property under the same schema
 * name. A field keeps the position of the ancestor's declaration it replaces
 * under the same schema name, as `{ ...parentFields, ...fields }` would.
 */
export function mergeInheritedFields<T extends InheritableField>(
  fieldsByClass: T[][],
): T[] {
  const fieldsBySchemaName = new Map<string, T>();

  for (const fields of fieldsByClass) {
    const redeclared = new Map(
      fields.map((field) => [field.name, field.schemaName]),
    );
    for (const [schemaName, field] of fieldsBySchemaName) {
      if (
        redeclared.has(field.name) &&
        redeclared.get(field.name) !== schemaName
      ) {
        fieldsBySchemaName.delete(schemaName);
      }
    }
    fields.forEach((field) => fieldsBySchemaName.set(field.schemaName, field));
  }
  return [...fieldsBySchemaName.values()];
}
