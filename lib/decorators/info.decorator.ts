import { PipeTransform, Type } from '@nestjs/common';
import 'reflect-metadata';
import { GqlParamtype } from '../enums/gql-paramtype.enum';
import { createGqlPipesParamDecorator } from './param.utils';

export function Info(...pipes: (Type<PipeTransform> | PipeTransform)[]) {
  return createGqlPipesParamDecorator(GqlParamtype.INFO)(undefined, ...pipes);
}
