// This file is copied from `apollo-tooling`. The only difference is that it has a hack to not remove federation specific properties.
// The changed lines are 31-40 and 85-87 and the original file can be found here:
// https://github.com/apollographql/apollo-tooling/blob/master/packages/apollo-graphql/src/schema/transformSchema.ts

import {
  GraphQLFieldConfigArgumentMap,
  GraphQLFieldConfigMap,
  GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNamedType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLSchema,
  GraphQLType,
  GraphQLUnionType,
  isInputObjectType,
  isInterfaceType,
  isIntrospectionType,
  isListType,
  isNonNullType,
  isObjectType,
  isUnionType,
} from 'graphql';

declare module 'graphql/type/definition' {
  interface GraphQLObjectType {
    resolveReference?: any;
  }

  interface GraphQLObjectTypeConfig<TSource, TContext> {
    resolveReference?: any;
  }
}

type TypeTransformer = (
  type: GraphQLNamedType,
) => GraphQLNamedType | null | undefined;

export function transformSchema(
  schema: GraphQLSchema,
  transformType: TypeTransformer,
): GraphQLSchema {
  const typeMap: { [typeName: string]: GraphQLNamedType } = Object.create(null);

  for (const oldType of Object.values(schema.getTypeMap())) {
    if (isIntrospectionType(oldType)) continue;

    const result = transformType(oldType);

    // Returning `null` removes the type.
    if (result === null) continue;

    // Returning `undefined` keeps the old type.
    const newType = result || oldType;
    typeMap[newType.name] = recreateNamedType(newType);
  }

  const schemaConfig = schema.toConfig();

  return new GraphQLSchema({
    ...schemaConfig,
    types: Object.values(typeMap),
    query: replaceMaybeType(schemaConfig.query),
    mutation: replaceMaybeType(schemaConfig.mutation),
    subscription: replaceMaybeType(schemaConfig.subscription),
  });

  function recreateNamedType(type: GraphQLNamedType): GraphQLNamedType {
    if (isObjectType(type)) {
      const config = type.toConfig();

      const objectType = new GraphQLObjectType({
        ...config,
        interfaces: () => config.interfaces.map(replaceNamedType),
        fields: () => replaceFields(config.fields),
      });

      if (type.resolveReference) {
        objectType.resolveReference = type.resolveReference;
      }

      return objectType;
    } else if (isInterfaceType(type)) {
      const config = type.toConfig();

      return new GraphQLInterfaceType({
        ...config,
        fields: () => replaceFields(config.fields),
      });
    } else if (isUnionType(type)) {
      const config = type.toConfig();

      return new GraphQLUnionType({
        ...config,
        types: () => config.types.map(replaceNamedType),
      });
    } else if (isInputObjectType(type)) {
      const config = type.toConfig();

      return new GraphQLInputObjectType({
        ...config,
        fields: () => replaceInputFields(config.fields),
      });
    }

    return type;
  }

  function replaceType<T extends GraphQLType>(
    type: GraphQLList<T>,
  ): GraphQLList<T>;
  function replaceType<T extends GraphQLType>(
    type: GraphQLNonNull<T>,
  ): GraphQLNonNull<T>;
  function replaceType(type: GraphQLNamedType): GraphQLNamedType;
  function replaceType(type: GraphQLOutputType): GraphQLOutputType;
  function replaceType(type: GraphQLInputType): GraphQLInputType;
  function replaceType(type: GraphQLType): GraphQLType {
    if (isListType(type)) {
      return new GraphQLList(replaceType(type.ofType));
    } else if (isNonNullType(type)) {
      return new GraphQLNonNull(replaceType(type.ofType));
    }
    return replaceNamedType(type);
  }

  function replaceNamedType<T extends GraphQLNamedType>(type: T): T {
    const newType = typeMap[type.name] as T;
    return newType ? newType : type;
  }

  function replaceMaybeType<T extends GraphQLNamedType>(
    type: T | null | undefined,
  ): T | undefined {
    return type ? replaceNamedType(type) : undefined;
  }

  function replaceFields<TSource, TContext>(
    fieldsMap: GraphQLFieldConfigMap<TSource, TContext>,
  ): GraphQLFieldConfigMap<TSource, TContext> {
    return mapValues(fieldsMap, (field) => ({
      ...field,
      type: replaceType(field.type),
      args: field.args ? replaceArgs(field.args) : undefined,
    }));
  }

  function replaceInputFields(
    fieldsMap: GraphQLInputFieldConfigMap,
  ): GraphQLInputFieldConfigMap {
    return mapValues(fieldsMap, (field) => ({
      ...field,
      type: replaceType(field.type),
    }));
  }

  function replaceArgs(args: GraphQLFieldConfigArgumentMap) {
    return mapValues(args, (arg) => ({
      ...arg,
      type: replaceType(arg.type),
    }));
  }
}

function mapValues<T, U = T>(
  object: Record<string, T>,
  callback: (value: T) => U,
): Record<string, U> {
  const result: Record<string, U> = Object.create(null);
  for (const [key, value] of Object.entries(object)) {
    result[key] = callback(value);
  }
  return result;
}
