import { PipeTransform, Type } from '@nestjs/common';
import { isNil, isObject, isString } from '@nestjs/common/utils/shared.utils';
import * as optional from 'optional';
import 'reflect-metadata';
import { GqlParamtype } from '../enums/gql-paramtype.enum';
import { PARAM_ARGS_METADATA } from '../graphql.constants';

const { Arg: TypeGqlArg, Args: TypeGqlArgs } =
  optional('type-graphql') || ({} as any);

export type ParamData = object | string | number;
export interface ParamsMetadata {
  [prop: number]: {
    index: number;
    data?: ParamData;
  };
}

const assignMetadata = (
  args: ParamsMetadata,
  paramtype: GqlParamtype,
  index: number,
  data?: ParamData,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
) => ({
  ...args,
  [`${paramtype}:${index}`]: {
    index,
    data,
    pipes,
  },
});

const createParamDecorator = (paramtype: GqlParamtype) => {
  return (data?: ParamData): ParameterDecorator => (target, key, index) => {
    const args =
      Reflect.getMetadata(PARAM_ARGS_METADATA, target.constructor, key) || {};
    Reflect.defineMetadata(
      PARAM_ARGS_METADATA,
      assignMetadata(args, paramtype, index, data),
      target.constructor,
      key,
    );
  };
};

const addPipesMetadata = (
  paramtype: GqlParamtype,
  data: any,
  pipes: (Type<PipeTransform> | PipeTransform)[],
  target: Object,
  key: string | symbol,
  index: number,
) => {
  const args =
    Reflect.getMetadata(PARAM_ARGS_METADATA, target.constructor, key) || {};
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

const createPipesParamDecorator = (paramtype: GqlParamtype) => (
  data?,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator => (target, key, index) => {
  addPipesMetadata(paramtype, data, pipes, target, key, index);
};

export const Root: () => ParameterDecorator = createParamDecorator(
  GqlParamtype.ROOT,
);
export const Parent: () => ParameterDecorator = createParamDecorator(
  GqlParamtype.ROOT,
);

export interface ArgsOptions {
  name?: string;
  type: () => Type<any>;
}
export function Args();
export function Args(...pipes: (Type<PipeTransform> | PipeTransform)[]);
export function Args(
  property: string,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
);
export function Args(
  options: ArgsOptions,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
);
export function Args(
  propertyOrOptions?:
    | string
    | (Type<PipeTransform> | PipeTransform)
    | ArgsOptions,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
) {
  let typeFn = undefined;
  let property = propertyOrOptions;
  if (propertyOrOptions && isObject(propertyOrOptions)) {
    property = (propertyOrOptions as Record<string, any>).name;
    typeFn = (propertyOrOptions as Record<string, any>).type;
  }
  return (target, key, index) => {
    addPipesMetadata(GqlParamtype.ARGS, property, pipes, target, key, index);
    if (property) {
      isString(property)
        ? TypeGqlArg && TypeGqlArg(property, typeFn)(target, key, index)
        : TypeGqlArgs && TypeGqlArgs(typeFn)(target, key, index);
    }
  };
}

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
  return createPipesParamDecorator(GqlParamtype.CONTEXT)(property, ...pipes);
}

export function Info(...pipes: (Type<PipeTransform> | PipeTransform)[]) {
  return createPipesParamDecorator(GqlParamtype.INFO)(undefined, ...pipes);
}
