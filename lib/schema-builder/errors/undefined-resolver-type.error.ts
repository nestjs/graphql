export class UndefinedResolverTypeError extends Error {
  constructor(name: string) {
    super(
      `Undefined resolver type error. Make sure you are providing an explicit object type for the "${name}" (e.g., "@Resolver(() => Cat)").`,
    );
  }
}
