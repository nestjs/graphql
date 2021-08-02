import { GraphqlWsException } from '../../../lib/graphql-ws/graphql-ws.exception';

export class MissingAuthorizationException extends GraphqlWsException {
  constructor() {
    super('Missing authorization', 4100);
  }
}
