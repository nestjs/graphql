import {
  GraphQLScalarLiteralParser,
  GraphQLScalarSerializer,
  GraphQLScalarValueParser,
} from 'graphql';

export interface CustomScalar<T, K> {
  description?: string;
  parseValue: GraphQLScalarValueParser<K>;
  serialize: GraphQLScalarSerializer<T>;
  parseLiteral: GraphQLScalarLiteralParser<K>;
}
