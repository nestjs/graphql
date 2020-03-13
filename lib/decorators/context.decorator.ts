import { PipeTransform, Type } from '@nestjs/common';
import 'reflect-metadata';
import { GqlParamtype } from '../enums/gql-paramtype.enum';
import { createGqlPipesParamDecorator } from './param.utils';

/**
 * Resolver method parameter decorator. Extracts the `Context`
 * object from the underlying platform and populates the decorated
 * parameter with the value of `Context`.
 */
export function Context(): ParameterDecorator;
/**
 * Resolver method parameter decorator. Extracts the `Context`
 * object from the underlying platform and populates the decorated
 * parameter with the value of `Context`.
 */
export function Context(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
/**
 * Resolver method parameter decorator. Extracts the `Context`
 * object from the underlying platform and populates the decorated
 * parameter with the value of `Context`.
 */
export function Context(
  property: string,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
/**
 * Resolver method parameter decorator. Extracts the `Context`
 * object from the underlying platform and populates the decorated
 * parameter with the value of `Context`.
 */
export function Context(
  property?: string | (Type<PipeTransform> | PipeTransform),
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator {
  return createGqlPipesParamDecorator(GqlParamtype.CONTEXT)(property, ...pipes);
}
