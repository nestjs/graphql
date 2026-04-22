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
  parseValue: (value: unknown) => K | null | undefined;
  serialize: (value: unknown) => T | null | undefined;
  parseLiteral: (
    valueNode: ValueNode,
    variables?: { [key: string]: any } | null,
  ) => K | null | undefined;
}
