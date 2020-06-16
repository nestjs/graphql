export declare class DefaultValuesConflictError extends Error {
  constructor(
    hostTypeName: string,
    fieldName: string,
    decoratorDefaultVal: unknown,
    initializerDefaultVal: unknown,
  );
}
