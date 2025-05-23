export class DefaultValuesConflictError extends Error {
  constructor(
    hostTypeName: string,
    fieldName: string,
    decoratorDefaultVal: any,
    initializerDefaultVal: any,
  ) {
    super(
      `Error caused by mis-matched default values for the "${fieldName}" field of "${hostTypeName}". The default value from the decorator "${decoratorDefaultVal}" is not equal to the property initializer value "${initializerDefaultVal}". Ensure that these values match.`,
    );
  }
}
