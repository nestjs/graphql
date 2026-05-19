import { PipeTransform, Type } from '@nestjs/common';
import 'reflect-metadata';
import { GqlParamtype } from '../enums/gql-paramtype.enum.js';
import { createGqlPipesParamDecorator } from './param.utils.js';

/**
 * Resolver method parameter decorator. Extracts the `Info`
 * object from the underlying platform and populates the decorated
 * parameter with the value of `Info`.
 *
 * @publicApi
 */
export function Info(...pipes: (Type<PipeTransform> | PipeTransform)[]) {
  return createGqlPipesParamDecorator(GqlParamtype.INFO)(undefined, ...pipes);
}
