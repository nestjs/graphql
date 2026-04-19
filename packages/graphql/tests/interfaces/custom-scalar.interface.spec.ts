import { Kind, ValueNode } from 'graphql';
import { expectTypeOf } from 'vitest';
import { CustomScalar } from '../../lib/interfaces';

describe('CustomScalar', () => {
  it('should allow parseLiteral, parseValue and serialize to return null or undefined', () => {
    class DateScalar implements CustomScalar<number, Date> {
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

    const scalar = new DateScalar();

    expect(
      scalar.parseLiteral({ kind: Kind.STRING, value: 'noop' }),
    ).toBeNull();
    expect(scalar.parseLiteral({ kind: Kind.INT, value: '0' })).toBeInstanceOf(
      Date,
    );
    expect(scalar.parseValue('not-a-number')).toBeNull();
    expect(scalar.serialize('not-a-date')).toBeNull();
  });

  it('should expose method signatures whose return types include null and undefined', () => {
    type Methods = CustomScalar<number, Date>;

    expectTypeOf<ReturnType<Methods['parseLiteral']>>().toEqualTypeOf<
      Date | null | undefined
    >();
    expectTypeOf<ReturnType<Methods['parseValue']>>().toEqualTypeOf<
      Date | null | undefined
    >();
    expectTypeOf<ReturnType<Methods['serialize']>>().toEqualTypeOf<
      number | null | undefined
    >();
  });
});
