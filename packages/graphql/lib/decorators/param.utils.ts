import { PipeTransform, Type } from '@nestjs/common';
import { isNil, isString } from '@nestjs/common/utils/shared.utils.js';
import 'reflect-metadata';
import { GqlParamtype } from '../enums/gql-paramtype.enum.js';
import { PARAM_ARGS_METADATA } from '../graphql.constants.js';

export type ParamData = object | string | number;
export type ParamsMetadata = Record<
  number,
  {
    index: number;
    data?: ParamData;
  }
>;

function assignMetadata(
  args: ParamsMetadata,
  paramtype: GqlParamtype,
  index: number,
  data?: ParamData,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
) {
  return {
    ...args,
    [`${paramtype}:${index}`]: {
      index,
      data,
      pipes,
    },
  };
}

/**
 * Reads the args a param decorator at `index` adds to. An overriding method
 * starts from the args of the method it overrides, so the entry inherited at
 * `index` is left out and replaced by the one of the override (as
 * `getParamArgsMetadata()` of `@nestjs/common` does).
 */
function getParamArgsMetadata(
  target: object,
  key: string | symbol,
  index: number,
): ParamsMetadata {
  const args: ParamsMetadata =
    Reflect.getMetadata(PARAM_ARGS_METADATA, target.constructor, key) || {};
  const inherited: ParamsMetadata =
    Reflect.getMetadata(
      PARAM_ARGS_METADATA,
      Object.getPrototypeOf(target.constructor),
      key,
    ) || {};
  // "assignMetadata()" spreads shallowly, so an entry the override inherited
  // keeps the reference of the entry of the parent class
  return Object.fromEntries(
    Object.entries(args).filter(
      ([argKey, arg]) => arg.index !== index || arg !== inherited[argKey],
    ),
  );
}

export const createGqlParamDecorator = (paramtype: GqlParamtype) => {
  return (data?: ParamData): ParameterDecorator =>
    (target, key, index) => {
      const args = getParamArgsMetadata(target, key, index);
      Reflect.defineMetadata(
        PARAM_ARGS_METADATA,
        assignMetadata(args, paramtype, index, data),
        target.constructor,
        key,
      );
    };
};

export const addPipesMetadata = (
  paramtype: GqlParamtype,
  data: any,
  pipes: (Type<PipeTransform> | PipeTransform)[],
  target: Record<string, any>,
  key: string | symbol,
  index: number,
) => {
  const args = getParamArgsMetadata(target, key, index);
  const hasParamData = isNil(data) || isString(data);
  const paramData = hasParamData ? data : undefined;
  const paramPipes = hasParamData ? pipes : [data, ...pipes];

  Reflect.defineMetadata(
    PARAM_ARGS_METADATA,
    assignMetadata(args, paramtype, index, paramData, ...paramPipes),
    target.constructor,
    key,
  );
};

export const createGqlPipesParamDecorator =
  (paramtype: GqlParamtype) =>
  (
    data?: any,
    ...pipes: (Type<PipeTransform> | PipeTransform)[]
  ): ParameterDecorator =>
  (target, key, index) => {
    addPipesMetadata(paramtype, data, pipes, target, key, index);
  };
