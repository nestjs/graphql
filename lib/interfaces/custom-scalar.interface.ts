import { ValueNode } from 'graphql';

export interface CustomScalar<T, K> {
  description: string | null | undefined;
  parseValue(value: T): K | null | undefined;
  serialize(value: K): T | null | undefined;
  parseLiteral(ast: ValueNode): K | null | undefined;
}
