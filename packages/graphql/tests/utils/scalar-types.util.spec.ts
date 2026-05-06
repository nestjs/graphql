import { Kind, ValueNode } from 'graphql';
import { CustomScalar } from '../../lib/interfaces/index.js';
import { createScalarType } from '../../lib/utils/scalar-types.utils.js';

describe('createScalarType', () => {
  class BaseScalar implements CustomScalar<number, Date> {
    description = 'Date custom scalar type';

    parseValue(value: unknown): Date | null {
      return typeof value === 'number' ? new Date(value) : null;
    }

    serialize(value: unknown): number | null {
      return value instanceof Date ? value.getTime() : null;
    }

    parseLiteral(ast: ValueNode): Date | null {
      if (ast.kind === Kind.INT) {
        return new Date(parseInt(ast.value, 10));
      }
      return null;
    }
  }

  it('should propagate description, parseValue, serialize and parseLiteral', () => {
    const scalar = createScalarType('Date', new BaseScalar());
    expect(scalar.name).toBe('Date');
    expect(scalar.description).toBe('Date custom scalar type');
    expect(scalar.parseValue(0)).toEqual(new Date(0));
    expect(scalar.serialize(new Date(0))).toBe(0);
    expect(scalar.parseLiteral({ kind: Kind.INT, value: '0' }, {})).toEqual(
      new Date(0),
    );
  });

  it('should propagate specifiedByURL when provided by the instance', () => {
    class DateTimeScalar extends BaseScalar {
      specifiedByURL = 'https://scalars.graphql.org/andimarek/date-time.html';
    }
    const scalar = createScalarType('DateTime', new DateTimeScalar());
    expect(scalar.specifiedByURL).toBe(
      'https://scalars.graphql.org/andimarek/date-time.html',
    );
  });

  it('should propagate extensions when provided by the instance', () => {
    class TaggedScalar extends BaseScalar {
      extensions = { tag: 'public' };
    }
    const scalar = createScalarType('Tagged', new TaggedScalar());
    expect(scalar.extensions).toEqual({ tag: 'public' });
  });

  it('should leave specifiedByURL and extensions at GraphQL defaults when not set', () => {
    const scalar = createScalarType('Plain', new BaseScalar());
    expect(scalar.specifiedByURL).toBeUndefined();
    expect(scalar.extensions).toEqual({});
  });
});
