import {
  ApolloLink,
  FetchResult,
  Observable,
  Operation,
} from '@apollo/client/core';

import { Client } from 'graphql-ws';
import { print } from 'graphql';

export class GraphQLWsLink extends ApolloLink {
  private client: Client;

  constructor(client: Client) {
    super();
    this.client = client;
  }

  public request(operation: Operation): Observable<FetchResult> {
    return new Observable((sink) => {
      return this.client.subscribe<FetchResult>(
        { ...operation, query: print(operation.query) },
        {
          next: sink.next.bind(sink),
          complete: sink.complete.bind(sink),
          error: sink.error.bind(sink),
        },
      );
    });
  }
}
