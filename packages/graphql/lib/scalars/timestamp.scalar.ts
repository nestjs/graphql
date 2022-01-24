import { GraphQLScalarType, Kind, ValueNode } from 'graphql';

export const GraphQLTimestamp = new GraphQLScalarType({
  name: 'Timestamp',
  description:
    '`Date` type as integer. Type represents date and time as number of milliseconds from start of UNIX epoch.',
  serialize(value: Date) {
    return value instanceof Date ? value.getTime() : null;
  },
  parseValue(value: string | null) {
    try {
      return value !== null ? new Date(value) : null;
    } catch {
      return null;
    }
  },
  parseLiteral(ast: ValueNode) {
    if (ast.kind === Kind.INT) {
      const num = parseInt(ast.value, 10);
      return new Date(num);
    } else if (ast.kind === Kind.STRING) {
      return this.parseValue(ast.value);
    }
    return null;
  },
});
