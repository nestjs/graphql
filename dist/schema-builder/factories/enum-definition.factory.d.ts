import { GraphQLEnumType } from 'graphql';
import { EnumMetadata } from '../metadata';
export interface EnumDefinition {
  enumRef: object;
  type: GraphQLEnumType;
}
export declare class EnumDefinitionFactory {
  create(metadata: EnumMetadata): EnumDefinition;
  private getEnumValues;
}
