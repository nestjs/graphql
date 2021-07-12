import { GraphQLWsException } from '../../../lib/graphql-ws/graphql-ws.exception';

export class MissingAuthorizationException extends GraphQLWsException {
  constructor() {
    super('Missing authorization', 4100);
  }
}
