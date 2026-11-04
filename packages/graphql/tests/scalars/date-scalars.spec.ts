import {
  graphqlSync,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString,
  Kind,
  ValueNode,
} from 'graphql';
import {
  GraphQLISODateTime,
  GraphQLTimestamp,
} from '../../lib/scalars/index.js';

describe('GraphQLISODateTime', () => {
  it('should parse a date-time string', () => {
    expect(GraphQLISODateTime.parseValue('2019-12-03T09:54:33Z')).toEqual(
      new Date('2019-12-03T09:54:33Z'),
    );
    expect(
      GraphQLISODateTime.parseLiteral(
        { kind: Kind.STRING, value: '2019-12-03T09:54:33Z' },
        {},
      ),
    ).toEqual(new Date('2019-12-03T09:54:33Z'));
  });

  it('should keep accepting Date instances and epoch milliseconds as variables', () => {
    const date = new Date('2019-12-03T09:54:33Z');
    expect(GraphQLISODateTime.parseValue(date)).toEqual(date);
    expect(GraphQLISODateTime.parseValue(date.getTime())).toEqual(date);
  });

  it('should throw for a non-string literal instead of returning null', () => {
    const literals: ValueNode[] = [
      { kind: Kind.INT, value: '123' },
      { kind: Kind.FLOAT, value: '1.5' },
      { kind: Kind.BOOLEAN, value: true },
      { kind: Kind.ENUM, value: 'FOO' },
      { kind: Kind.LIST, values: [] },
    ];
    for (const ast of literals) {
      expect(() => GraphQLISODateTime.parseLiteral(ast, {})).toThrow(
        /DateTime cannot represent non-string value/,
      );
    }
  });

  it('should throw for a variable that is neither a string, a number nor a Date', () => {
    for (const value of [true, { a: 1 }, [2020], [[[0], 0], 0], null]) {
      expect(() => GraphQLISODateTime.parseValue(value)).toThrow(
        /DateTime cannot represent non-string value/,
      );
    }
  });

  it('should throw for a value that does not describe a date', () => {
    for (const value of ['not a date', 1e300, NaN]) {
      expect(() => GraphQLISODateTime.parseValue(value)).toThrow(
        /DateTime cannot represent an invalid date-time value/,
      );
    }
    expect(() =>
      GraphQLISODateTime.parseLiteral(
        { kind: Kind.STRING, value: 'not a date' },
        {},
      ),
    ).toThrow(/DateTime cannot represent an invalid date-time value/);
  });

  it('should not echo the rejected value back in the error message', () => {
    const value = 'x'.repeat(10_000);
    expect(() => GraphQLISODateTime.parseValue(value)).toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining(value),
      }),
    );
  });
});

describe('GraphQLTimestamp', () => {
  it('should parse a number of milliseconds or a date string', () => {
    expect(GraphQLTimestamp.parseValue(0)).toEqual(new Date(0));
    expect(GraphQLTimestamp.parseValue('2019-12-03T09:54:33Z')).toEqual(
      new Date('2019-12-03T09:54:33Z'),
    );
    expect(
      GraphQLTimestamp.parseLiteral({ kind: Kind.INT, value: '0' }, {}),
    ).toEqual(new Date(0));
    expect(
      GraphQLTimestamp.parseLiteral(
        { kind: Kind.STRING, value: '2019-12-03T09:54:33Z' },
        {},
      ),
    ).toEqual(new Date('2019-12-03T09:54:33Z'));
  });

  it('should throw for a literal that is neither an int nor a string', () => {
    const literals: ValueNode[] = [
      { kind: Kind.FLOAT, value: '1.5' },
      { kind: Kind.BOOLEAN, value: true },
      { kind: Kind.ENUM, value: 'FOO' },
      { kind: Kind.OBJECT, fields: [] },
      { kind: Kind.LIST, values: [] },
    ];
    for (const ast of literals) {
      expect(() => GraphQLTimestamp.parseLiteral(ast, {})).toThrow(
        /Timestamp cannot represent non-numeric value/,
      );
    }
  });

  it('should throw for a variable that is neither a number, a string nor a Date', () => {
    for (const value of [true, { a: 1 }, { toString: 1 }, [0], null]) {
      expect(() => GraphQLTimestamp.parseValue(value)).toThrow(
        /Timestamp cannot represent non-numeric value/,
      );
    }
  });

  it('should throw for a value that does not describe a date', () => {
    for (const value of ['not a date', 1e300, NaN, Infinity]) {
      expect(() => GraphQLTimestamp.parseValue(value)).toThrow(
        /Timestamp cannot represent/,
      );
    }
    expect(() =>
      GraphQLTimestamp.parseLiteral(
        { kind: Kind.INT, value: '9'.repeat(400) },
        {},
      ),
    ).toThrow(/Timestamp cannot represent/);
  });
});

describe('date scalars in non-null positions', () => {
  const describeValue = (value: unknown): string =>
    value === null
      ? 'null'
      : Array.isArray(value)
      ? `[${value.map(describeValue).join(',')}]`
      : value instanceof Date
      ? Number.isNaN(value.getTime())
        ? 'Invalid Date'
        : value.toISOString()
      : typeof value;

  const createSchema = (scalar: GraphQLScalarType) =>
    new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          one: {
            type: GraphQLString,
            args: { when: { type: new GraphQLNonNull(scalar) } },
            resolve: (_, args) => describeValue(args.when),
          },
          many: {
            type: GraphQLString,
            args: {
              when: { type: new GraphQLList(new GraphQLNonNull(scalar)) },
            },
            resolve: (_, args) => describeValue(args.when),
          },
        },
      }),
    });

  const run = (
    scalar: GraphQLScalarType,
    source: string,
    variableValues?: Record<string, unknown>,
  ) => graphqlSync({ schema: createSchema(scalar), source, variableValues });

  const scalars: Record<string, GraphQLScalarType> = {
    DateTime: GraphQLISODateTime,
    Timestamp: GraphQLTimestamp,
  };

  it.each([
    ['DateTime', '{ one(when: 123) }'],
    ['DateTime', '{ one(when: true) }'],
    ['DateTime', '{ many(when: [1, "x", true]) }'],
    ['Timestamp', '{ one(when: true) }'],
    ['Timestamp', '{ many(when: [0, 1.5]) }'],
  ])('should refuse a wrong-kind %s literal: %s', (name, source) => {
    const result = run(scalars[name], source);
    expect(result.errors?.length).toBeGreaterThan(0);
    expect(result.data).toBeUndefined();
  });

  it.each([
    ['DateTime', 'not a date'],
    ['DateTime', { a: 1 }],
    ['DateTime', true],
    ['Timestamp', { toString: 1 }],
  ])('should refuse a malformed %s variable: %j', (name, value) => {
    const result = run(
      scalars[name],
      `query($w: [${name}!]) { many(when: $w) }`,
      { w: [value] },
    );
    expect(result.errors).toHaveLength(1);
    expect(result.data).toBeUndefined();
  });

  it('should refuse a deeply nested array variable without coercing it', () => {
    let value: unknown = [0];
    for (let i = 0; i < 2_000; i++) {
      value = [value, 0];
    }
    const start = performance.now();
    const result = run(
      GraphQLISODateTime,
      'query($w: DateTime!) { one(when: $w) }',
      { w: value },
    );
    expect(result.errors).toHaveLength(1);
    expect(performance.now() - start).toBeLessThan(500);
  });

  it('should still deliver valid dates', () => {
    expect(
      run(GraphQLISODateTime, '{ one(when: "2019-12-03T09:54:33Z") }').data,
    ).toEqual({ one: '2019-12-03T09:54:33.000Z' });
    expect(run(GraphQLTimestamp, '{ many(when: [0]) }').data).toEqual({
      many: '[1970-01-01T00:00:00.000Z]',
    });
  });
});
