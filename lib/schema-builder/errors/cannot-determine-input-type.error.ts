export class CannotDetermineInputTypeError extends Error {
  constructor(hostType: string) {
    super(
      `Cannot determine a GraphQL input type for the "${hostType}". Make sure your class is decorated with an appropriate decorator.`,
    );
  }
}
