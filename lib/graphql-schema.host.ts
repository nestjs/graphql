import { Injectable } from '@nestjs/common';
import { GraphQLSchema } from 'graphql';

@Injectable()
export class GraphQLSchemaHost {
  private _schema: GraphQLSchema;

  set schema(schemaRef: GraphQLSchema) {
    this._schema = schemaRef;
  }

  get schema(): GraphQLSchema {
    if (!this._schema) {
      throw new Error(
        'GraphQL schema has not yet been created. ' +
          'Make sure to call the "GraphQLSchemaHost#schema" getter when the application is already initialized (after the "onModuleInit" hook triggered by either "app.listen()" or "app.init()" method).',
      );
    }
    return this._schema;
  }
}
