import { Type } from '@nestjs/common';
import { GraphQLScalarType } from 'graphql';

export type GqlTypeReference<T = any> =
  | Type<T>
  | GraphQLScalarType
  | Function
  | object
  | symbol;
export type ReturnTypeFuncValue = GqlTypeReference | [GqlTypeReference];
export type ReturnTypeFunc<T extends ReturnTypeFuncValue = any> = (
  returns?: void,
) => T;
