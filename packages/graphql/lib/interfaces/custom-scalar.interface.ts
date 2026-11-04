import { ValueNode } from 'graphql';

export interface CustomScalar<T, K> {
  description?: string;
  /**
   * URL pointing to the specification for this scalar (emitted as the
   * `@specifiedBy(url: ...)` directive in the generated SDL).
   */
  specifiedByURL?: string;
  /**
   * Arbitrary metadata attached to the scalar, accessible through the
   * generated `GraphQLScalarType`'s `extensions` field.
   */
  extensions?: Record<string, unknown>;
  /**
   * Parses a variable value. Throw a `GraphQLError` for input the scalar
   * cannot represent; a `null` or `undefined` result is treated as invalid
   * input as well (it never becomes the value of the argument).
   */
  parseValue: (value: unknown) => K | null | undefined;
  serialize: (value: unknown) => T | null | undefined;
  /**
   * Parses an inline literal. Throw a `GraphQLError` for a literal the scalar
   * cannot represent; a `null` or `undefined` result is treated as invalid
   * input as well (it never becomes the value of the argument).
   */
  parseLiteral: (
    valueNode: ValueNode,
    variables?: { [key: string]: any } | null,
  ) => K | null | undefined;
}
