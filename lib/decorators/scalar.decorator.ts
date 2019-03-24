import { SetMetadata } from '@nestjs/common';
import {
  SCALAR_NAME_METADATA,
  SCALAR_TYPE_METADATA,
} from '../graphql.constants';
import { ReturnTypeFunc } from './../external/type-graphql.types';

export function Scalar(name: string): ClassDecorator;
export function Scalar(name: string, typeFunc: ReturnTypeFunc): ClassDecorator;
export function Scalar(
  name: string,
  typeFunc?: ReturnTypeFunc,
): ClassDecorator {
  return (target, key?, descriptor?) => {
    SetMetadata(SCALAR_NAME_METADATA, name)(target, key, descriptor);
    SetMetadata(SCALAR_TYPE_METADATA, typeFunc)(target, key, descriptor);
  };
}
