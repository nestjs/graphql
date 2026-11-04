import {
  GraphQLError,
  GraphQLScalarType,
  Kind,
  print,
  ValueNode,
} from 'graphql';

// See "coerceDateTime": invalid input must throw, never become "null" or an
// "Invalid Date", and the rejected value is not echoed back.
function coerceTimestamp(value: unknown): Date {
  if (
    typeof value !== 'number' &&
    typeof value !== 'string' &&
    !(value instanceof Date)
  ) {
    throw new GraphQLError('Timestamp cannot represent non-numeric value.');
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new GraphQLError('Timestamp cannot represent an invalid date value.');
  }
  return date;
}

export const GraphQLTimestamp = new GraphQLScalarType({
  name: 'Timestamp',
  description:
    '`Date` type as integer. Type represents date and time as number of milliseconds from start of UNIX epoch.',
  serialize(value: Date) {
    return value instanceof Date ? value.getTime() : null;
  },
  parseValue(value: unknown) {
    return coerceTimestamp(value);
  },
  parseLiteral(ast: ValueNode) {
    if (ast.kind === Kind.INT) {
      return coerceTimestamp(parseInt(ast.value, 10));
    } else if (ast.kind === Kind.STRING) {
      return coerceTimestamp(ast.value);
    }
    throw new GraphQLError(
      `Timestamp cannot represent non-numeric value: ${print(ast)}`,
      { nodes: ast },
    );
  },
});
