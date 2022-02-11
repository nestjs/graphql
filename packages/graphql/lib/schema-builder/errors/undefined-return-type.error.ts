export class UndefinedReturnTypeError extends Error {
  constructor(decoratorName: string, methodKey: string) {
    super(
      `"${decoratorName}.${methodKey}" was defined in resolvers, but not in schema. If you use the @${decoratorName}() decorator with the code first approach enabled, remember to explicitly provide a return type function, e.g. @${decoratorName}(returns => Author).`,
    );
  }
}
