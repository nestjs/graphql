import { DocumentNode } from 'graphql';

export interface BuildFederatedSchemaOptions {
  typeDefs: DocumentNode;
  resolvers: any;
}
