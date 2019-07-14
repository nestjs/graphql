import { PipeTransform, Type } from '@nestjs/common';
import { isObject, isString } from '@nestjs/common/utils/shared.utils';
import 'reflect-metadata';
import { GqlParamtype } from '../enums/gql-paramtype.enum';
import { BasicOptions } from '../external/type-graphql.types';
import { lazyMetadataStorage } from '../storages/lazy-metadata.storage';
import { addPipesMetadata } from './param.utils';

let TypeGqlArg, TypeGqlArgs;
try {
  const TypeGql = require('type-graphql');
  TypeGqlArg = TypeGql.Arg;
  TypeGqlArgs = TypeGql.Args;
} catch (e) {}

export interface ArgsOptions extends BasicOptions {
  name?: string;
  type: () => any;
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
  let argOptions = {} as BasicOptions;
  let property = propertyOrOptions;

  if (
    propertyOrOptions &&
    isObject(propertyOrOptions) &&
    !(propertyOrOptions as PipeTransform).transform
  ) {
    property = (propertyOrOptions as Record<string, any>).name;
    typeFn = (propertyOrOptions as Record<string, any>).type;
    argOptions = {
      description: (propertyOrOptions as BasicOptions).description,
      nullable: (propertyOrOptions as BasicOptions).nullable,
      defaultValue: (propertyOrOptions as BasicOptions).defaultValue,
    };
  }

  return (target, key, index) => {
    addPipesMetadata(GqlParamtype.ARGS, property, pipes, target, key, index);
    property && isString(property)
      ? TypeGqlArg &&
        lazyMetadataStorage.store(() =>
          TypeGqlArg(property, typeFn, argOptions)(target, key, index),
        )
      : TypeGqlArgs &&
        lazyMetadataStorage.store(() =>
          TypeGqlArgs(typeFn)(target, key, index),
        );
  };
}
