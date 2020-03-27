export class CannotDetermineOutputTypeError extends Error {
  constructor(hostType: string) {
    super(
      `Cannot determine a GraphQL output type for the "${hostType}". Make sure your class is decorated with an appropriate decorator.`,
    );
  }
}
