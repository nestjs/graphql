export interface CustomScalar<T, K> {
  description: string;
  parseValue(value: T): K;
  serialize(value: K): T;
  parseLiteral(ast): K;
}
