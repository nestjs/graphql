// This file is copied from `apollographql/federation`. The only difference is
// that it has a hack to not remove federation specific properties.
// https://github.com/apollographql/federation/blob/main/subgraph-js/src/schema-helper/transformSchema.ts

import {
  GraphQLDirective,
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
  GraphQLResolveInfo,
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

type GraphQLReferenceResolver<TContext> = (
  reference: object,
  context: TContext,
  info: GraphQLResolveInfo,
) => any;

interface ApolloSubgraphExtensions<TContext> {
  resolveReference?: GraphQLReferenceResolver<TContext>;
}

declare module 'graphql/type/definition' {
  interface GraphQLObjectTypeExtensions<_TSource = any, _TContext = any> {
    apollo?: {
      subgraph?: ApolloSubgraphExtensions<_TContext>;
    };
  }

  interface GraphQLInterfaceTypeExtensions<_TSource = any, _TContext = any> {
    apollo?: {
      subgraph?: ApolloSubgraphExtensions<_TContext>;
    };
  }

  interface GraphQLUnionTypeExtensions<_TSource = any, _TContext = any> {
    apollo?: {
      subgraph?: ApolloSubgraphExtensions<_TContext>;
    };
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
    directives: replaceDirectives(schemaConfig.directives),
  });

  function recreateNamedType(type: GraphQLNamedType): GraphQLNamedType {
    if (isObjectType(type)) {
      const config = type.toConfig();

      const objectType = new GraphQLObjectType({
        ...config,
        interfaces: () => config.interfaces.map(replaceNamedType),
        fields: () => replaceFields(config.fields),
      });

      if (type.extensions?.apollo?.subgraph?.resolveReference) {
        objectType.extensions = {
          ...objectType.extensions,
          apollo: {
            ...objectType.extensions.apollo,
            subgraph: {
              ...objectType.extensions.apollo.subgraph,
              resolveReference:
                type.extensions.apollo.subgraph.resolveReference,
            },
          },
        };
        /**
         * Backcompat for old versions of @apollo/subgraph which didn't use
         * `extensions` This can be removed when support for @apollo/subgraph <
         * 0.4.2 is dropped Reference:
         * https://github.com/apollographql/federation/pull/1747
         */
        // @ts-expect-error (explanation above)
      } else if (type.resolveReference) {
        // @ts-expect-error (explanation above)
        objectType.resolveReference = type.resolveReference;
      }

      return objectType;
    } else if (isInterfaceType(type)) {
      const config = type.toConfig();

      return new GraphQLInterfaceType({
        ...config,
        interfaces: () => config.interfaces.map(replaceNamedType),
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

  function replaceDirectives(directives: GraphQLDirective[]) {
    return directives.map((directive) => {
      const config = directive.toConfig();
      return new GraphQLDirective({
        ...config,
        args: replaceArgs(config.args),
      });
    });
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
