import { ValueNode } from 'graphql';

export interface CustomScalar<T, K> {
  description?: string;
  parseValue: (value: unknown) => K | null | undefined;
  serialize: (value: unknown) => T | null | undefined;
  parseLiteral: (
    valueNode: ValueNode,
    variables?: { [key: string]: any } | null,
  ) => K | null | undefined;
}
