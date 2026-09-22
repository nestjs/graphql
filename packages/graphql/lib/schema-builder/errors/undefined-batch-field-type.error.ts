export class UndefinedBatchFieldTypeError extends Error {
  constructor(hostType: string, methodKey: string) {
    super(
      `Undefined batch field type error. "${hostType}#${methodKey}" must declare an explicit type function, as the type a batch method returns ("Map" or an array of results) cannot be reflected, e.g., "@BatchResolveField(() => [Post])".`,
    );
  }
}
