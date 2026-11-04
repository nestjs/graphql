import {
  GraphQLError,
  GraphQLScalarType,
  Kind,
  print,
  ValueNode,
} from 'graphql';

// graphql-js treats only a thrown error (or "undefined") as invalid input, so
// anything this scalar cannot represent must throw rather than return "null"
// or an "Invalid Date". The rejected value is not echoed back: graphql-js
// already prefixes a truncated form of it.
function coerceDateTime(value: unknown): Date {
  // Numbers (epoch milliseconds) are accepted for backward compatibility.
  if (
    typeof value !== 'string' &&
    typeof value !== 'number' &&
    !(value instanceof Date)
  ) {
    throw new GraphQLError('DateTime cannot represent non-string value.');
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new GraphQLError(
      'DateTime cannot represent an invalid date-time value.',
    );
  }
  return date;
}

export const GraphQLISODateTime = new GraphQLScalarType({
  name: 'DateTime',
  description:
    'A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format.',
  parseValue(value: unknown) {
    return coerceDateTime(value);
  },
  serialize(value: Date) {
    return value instanceof Date ? value.toISOString() : null;
  },
  parseLiteral(ast: ValueNode) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `DateTime cannot represent non-string value: ${print(ast)}`,
        { nodes: ast },
      );
    }
    return coerceDateTime(ast.value);
  },
});
