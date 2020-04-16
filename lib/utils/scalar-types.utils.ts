import { GraphQLScalarType } from 'graphql';

function bindInstanceContext(
  instance: Partial<GraphQLScalarType>,
  funcKey: keyof GraphQLScalarType,
) {
  return instance[funcKey]
    ? (instance[funcKey] as Function).bind(instance)
    : undefined;
}

export function createScalarType(
  name: string,
  instance: Partial<GraphQLScalarType>,
) {
  return new GraphQLScalarType({
    name,
    description: instance.description as string,
    parseValue: bindInstanceContext(instance, 'parseValue'),
    serialize: bindInstanceContext(instance, 'serialize'),
    parseLiteral: bindInstanceContext(instance, 'parseLiteral'),
  });
}
