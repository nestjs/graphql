import { GraphQLDirective, GraphQLScalarType } from 'graphql';
import { FieldMiddleware } from './field-middleware.interface';

export type DateScalarMode = 'isoDate' | 'timestamp';
export type NumberScalarMode = 'float' | 'integer';

export interface ScalarsTypeMap {
  type: Function;
  scalar: GraphQLScalarType;
}

export interface BuildSchemaOptions {
  /**
   * Date scalar mode
   * @default 'isoDate'
   */
  dateScalarMode?: DateScalarMode;

  /**
   * Number scalar mode
   * @default 'float'
   */
  numberScalarMode?: NumberScalarMode;

  /**
   * Scalars map
   */
  scalarsMap?: ScalarsTypeMap[];

  /**
   * Whether or not to register all detected orphaned types in the schema
   * @default true
   */
  autoRegisterOrphanedTypes?: boolean;

  /**
   * Orphaned type classes/enums that are not explicitly used in GraphQL types definitions
   */
  orphanedTypes?: (Function | object)[];

  /**
   * Disable checking on build the correctness of a schema
   */
  skipCheck?: boolean;

  /**
   * GraphQL directives
   */
  directives?: GraphQLDirective[];

  /**
   * Array of global field middleware functions
   */
  fieldMiddleware?: FieldMiddleware[];

  /**
   * Set to true if it should throw an error when the same Query / Mutation field is defined more than once
   */
  noDuplicatedFields?: boolean;

  /**
   * Add new line at the end of the generated GraphQL SDL file
   */
  addNewlineAtEnd?: boolean;
}
