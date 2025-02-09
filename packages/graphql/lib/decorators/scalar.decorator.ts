import { SetMetadata } from '@nestjs/common';
import {
  SCALAR_NAME_METADATA,
  SCALAR_TYPE_METADATA,
} from '../graphql.constants';
import { ReturnTypeFunc } from '../interfaces/return-type-func.interface';

/**
 * @publicApi
 *
 * Decorator that marks a class as a GraphQL scalar.
 */
export function Scalar(name: string): ClassDecorator;
/**
 * @publicApi
 *
 * Decorator that marks a class as a GraphQL scalar.
 */
export function Scalar(name: string, typeFunc: ReturnTypeFunc): ClassDecorator;
/**
 * @publicApi
 *
 * Decorator that marks a class as a GraphQL scalar.
 */
export function Scalar(
  name: string,
  typeFunc?: ReturnTypeFunc,
): ClassDecorator {
  return (target, key?, descriptor?) => {
    SetMetadata(SCALAR_NAME_METADATA, name)(target, key, descriptor);
    SetMetadata(SCALAR_TYPE_METADATA, typeFunc)(target, key, descriptor);
  };
}
