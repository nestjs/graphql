export class UnableToFindFieldsError extends Error {
  constructor(name: string) {
    super(
      `Unable to find fields for GraphQL type ${name}. Is your class annotated with an appropriate decorator?`,
    );
  }
}
