import { GraphqlWsException } from '../../../lib/graphql-ws/graphql-ws.exception';

export class MalformedTokenException extends GraphqlWsException {
  constructor() {
    super('Malformed token', 4101);
  }
}
