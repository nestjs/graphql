import { GraphQLDirective, GraphQLScalarType } from 'graphql';

export type DateScalarMode = 'isoDate' | 'timestamp';

export interface ScalarsTypeMap {
  type: Function;
  scalar: GraphQLScalarType;
}

export interface BuildSchemaOptions {
  /**
   * Date scalar mode
   */
  dateScalarMode?: DateScalarMode;

  /**
   * Scalars map
   */
  scalarsMap?: ScalarsTypeMap[];

  /**
   * Orphaned type classes that are not explicitly used in GraphQL types definitions
   */
  orphanedTypes?: Function[];

  /**
   * Disable checking on build the correctness of a schema
   */
  skipCheck?: boolean;

  /**
   * GraphQL directives
   */
  directives?: GraphQLDirective[];

  /**
   * GraphQL schema directives mapping
   */
  schemaDirectives?: Record<string, any>;
}
