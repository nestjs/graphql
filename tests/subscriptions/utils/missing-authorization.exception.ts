export class MissingAuthorizationException extends Error {
  constructor() {
    super('Missing authorization');
  }
}
