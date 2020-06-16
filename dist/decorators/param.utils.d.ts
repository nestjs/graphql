import { PipeTransform, Type } from '@nestjs/common';
import 'reflect-metadata';
import { GqlParamtype } from '../enums/gql-paramtype.enum';
export declare type ParamData = object | string | number;
export declare type ParamsMetadata = Record<
  number,
  {
    index: number;
    data?: ParamData;
  }
>;
export declare const createGqlParamDecorator: (
  paramtype: GqlParamtype,
) => (data?: ParamData) => ParameterDecorator;
export declare const addPipesMetadata: (
  paramtype: GqlParamtype,
  data: any,
  pipes: (Type<PipeTransform> | PipeTransform)[],
  target: Record<string, any>,
  key: string | symbol,
  index: number,
) => void;
export declare const createGqlPipesParamDecorator: (
  paramtype: GqlParamtype,
) => (
  data?: any,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
) => ParameterDecorator;
