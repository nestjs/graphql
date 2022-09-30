export class MultipleFieldsWithSameNameError extends Error {
  constructor(field: string, objectTypeName: string) {
    super(
      `Cannot define multiple fields with the same name "${field}" for type "${objectTypeName}"`,
    );
  }
}
