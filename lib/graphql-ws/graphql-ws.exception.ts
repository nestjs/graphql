/**
 * Base exception that closes a WebSocket connection when using `graphql-ws`.
 */
export class GraphQLWsException extends Error {
  /**
   * Instantiate a `GraphqlWsException`.
   *
   * @param reason Message explaining the error.
   * @param code Code for a `CloseEvent`.
   */
  constructor(readonly reason: string, readonly code: number) {
    super(reason);
  }
}
