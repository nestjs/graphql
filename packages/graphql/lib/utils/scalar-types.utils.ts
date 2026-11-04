import { GraphQLScalarType } from 'graphql';

function bindInstanceContext(
  instance: Partial<GraphQLScalarType>,
  funcKey: keyof GraphQLScalarType,
) {
  return instance[funcKey]
    ? (instance[funcKey] as Function).bind(instance)
    : undefined;
}

function bindInputParser(
  instance: Partial<GraphQLScalarType>,
  funcKey: 'parseValue' | 'parseLiteral',
) {
  const parse = bindInstanceContext(instance, funcKey);
  // "CustomScalar" parsers may return "null" for input they cannot parse, but
  // graphql-js only treats "undefined" (or a thrown error) as invalid and never
  // passes "null" to a parser, so a "null" result would slip through non-null
  // positions. Report it to graphql-js as "undefined" instead.
  return parse && ((...args: unknown[]) => parse(...args) ?? undefined);
}

export function createScalarType(
  name: string,
  instance: Partial<GraphQLScalarType>,
) {
  return new GraphQLScalarType({
    name,
    description: instance.description,
    specifiedByURL: instance.specifiedByURL,
    extensions: instance.extensions,
    parseValue: bindInputParser(instance, 'parseValue'),
    serialize: bindInstanceContext(instance, 'serialize'),
    parseLiteral: bindInputParser(instance, 'parseLiteral'),
  });
}
