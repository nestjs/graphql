import { GraphQLScalarType, Kind, ValueNode } from 'graphql';

export const GraphQLISODateTime = new GraphQLScalarType({
  name: 'DateTime',
  description:
    'A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format.',
  parseValue(value: string) {
    return new Date(value);
  },
  serialize(value: Date) {
    return value instanceof Date ? value.toISOString() : null;
  },
  parseLiteral(ast: ValueNode) {
    return ast.kind === Kind.STRING ? new Date(ast.value) : null;
  },
});
