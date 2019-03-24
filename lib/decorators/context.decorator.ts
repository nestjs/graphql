import { PipeTransform, Type } from '@nestjs/common';
import 'reflect-metadata';
import { GqlParamtype } from '../enums/gql-paramtype.enum';
import { createGqlPipesParamDecorator } from './param.utils';

export function Context();
export function Context(...pipes: (Type<PipeTransform> | PipeTransform)[]);
export function Context(
  property: string,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
);
export function Context(
  property?: string | (Type<PipeTransform> | PipeTransform),
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
) {
  return createGqlPipesParamDecorator(GqlParamtype.CONTEXT)(property, ...pipes);
}
