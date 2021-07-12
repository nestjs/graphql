import { GraphQLWsException } from '../../../lib/graphql-ws/graphql-ws.exception';

export class MalformedTokenException extends GraphQLWsException {
  constructor() {
    super('Malformed token', 4101);
  }
}
