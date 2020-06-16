import {
  GraphQLFieldConfigMap,
  GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
} from 'graphql';
export declare class TypeFieldsAccessor {
  extractFromInputType(
    gqlType: GraphQLInputObjectType,
  ): GraphQLInputFieldConfigMap;
  extractFromInterfaceOrObjectType<T = any, U = any>(
    type: GraphQLInterfaceType | GraphQLObjectType,
  ): GraphQLFieldConfigMap<T, U>;
}
