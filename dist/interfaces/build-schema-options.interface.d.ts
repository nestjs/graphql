import { GraphQLDirective, GraphQLScalarType } from 'graphql';
export declare type DateScalarMode = 'isoDate' | 'timestamp';
export interface ScalarsTypeMap {
  type: Function;
  scalar: GraphQLScalarType;
}
export interface BuildSchemaOptions {
  dateScalarMode?: DateScalarMode;
  scalarsMap?: ScalarsTypeMap[];
  orphanedTypes?: Function[];
  skipCheck?: boolean;
  directives?: GraphQLDirective[];
  schemaDirectives?: Record<string, any>;
}
