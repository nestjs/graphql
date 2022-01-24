export class CannotDetermineHostTypeError extends Error {
  constructor(externalField: string, hostType?: string) {
    super(
      `Cannot determine a GraphQL host type ${
        hostType ? ` (${hostType}?) ` : ``
      }for the "${externalField}" field. Make sure your class is decorated with an appropriate decorator (e.g., @ObjectType()).`,
    );
  }
}
