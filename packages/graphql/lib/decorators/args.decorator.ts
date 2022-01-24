import { PipeTransform, Type } from '@nestjs/common';
import {
  isFunction,
  isObject,
  isString,
} from '@nestjs/common/utils/shared.utils';
import 'reflect-metadata';
import { GqlParamtype } from '../enums/gql-paramtype.enum';
import { BaseTypeOptions } from '../interfaces';
import { LazyMetadataStorage } from '../schema-builder/storages/lazy-metadata.storage';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage';
import { isPipe } from '../utils/is-pipe.util';
import { reflectTypeFromMetadata } from '../utils/reflection.utilts';
import { addPipesMetadata } from './param.utils';

/**
 * Interface defining options that can be passed to `@Args()` decorator.
 */
export interface ArgsOptions extends BaseTypeOptions {
  /**
   * Name of the argument.
   */
  name?: string;
  /**
   * Description of the argument.
   */
  description?: string;
  /**
   * Function that returns a reference to the arguments host class.
   */
  type?: () => any;
}

/**
 * Resolver method parameter decorator. Extracts the arguments
 * object from the underlying platform and populates the decorated
 * parameter with the value of either all arguments or a single specified argument.
 */
export function Args(): ParameterDecorator;
/**
 * Resolver method parameter decorator. Extracts the arguments
 * object from the underlying platform and populates the decorated
 * parameter with the value of either all arguments or a single specified argument.
 */
export function Args(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
/**
 * Resolver method parameter decorator. Extracts the arguments
 * object from the underlying platform and populates the decorated
 * parameter with the value of either all arguments or a single specified argument.
 */
export function Args(
  property: string,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
/**
 * Resolver method parameter decorator. Extracts the arguments
 * object from the underlying platform and populates the decorated
 * parameter with the value of either all arguments or a single specified argument.
 */
export function Args(
  options: ArgsOptions,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
/**
 * Resolver method parameter decorator. Extracts the arguments
 * object from the underlying platform and populates the decorated
 * parameter with the value of either all arguments or a single specified argument.
 */
export function Args(
  property: string,
  options: ArgsOptions,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
/**
 * Resolver method parameter decorator. Extracts the arguments
 * object from the underlying platform and populates the decorated
 * parameter with the value of either all arguments or a single specified argument.
 */
export function Args(
  propertyOrOptionsOrPipe?:
    | string
    | (Type<PipeTransform> | PipeTransform)
    | ArgsOptions,
  optionsOrPipe?: ArgsOptions | (Type<PipeTransform> | PipeTransform),
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator {
  const [property, argOptions, argPipes] = getArgsOptions(
    propertyOrOptionsOrPipe,
    optionsOrPipe,
    pipes,
  );

  return (target: Object, key: string, index: number) => {
    addPipesMetadata(GqlParamtype.ARGS, property, argPipes, target, key, index);

    LazyMetadataStorage.store(target.constructor as Type<unknown>, () => {
      const { typeFn: reflectedTypeFn, options } = reflectTypeFromMetadata({
        metadataKey: 'design:paramtypes',
        prototype: target,
        propertyKey: key,
        index: index,
        explicitTypeFn: argOptions.type,
        typeOptions: argOptions,
      });

      const metadata = {
        target: target.constructor,
        methodName: key,
        typeFn: reflectedTypeFn,
        index,
        options,
      };

      if (property && isString(property)) {
        TypeMetadataStorage.addMethodParamMetadata({
          kind: 'arg',
          name: property,
          description: argOptions.description,
          ...metadata,
        });
      } else {
        TypeMetadataStorage.addMethodParamMetadata({
          kind: 'args',
          ...metadata,
        });
      }
    });
  };
}

function getArgsOptions(
  propertyOrOptionsOrPipe?:
    | string
    | (Type<PipeTransform> | PipeTransform)
    | ArgsOptions,
  optionsOrPipe?: ArgsOptions | (Type<PipeTransform> | PipeTransform),
  pipes?: (Type<PipeTransform> | PipeTransform)[],
): [string, ArgsOptions, (Type<PipeTransform> | PipeTransform)[]] {
  if (!propertyOrOptionsOrPipe || isString(propertyOrOptionsOrPipe)) {
    const propertyKey = propertyOrOptionsOrPipe as string;

    let options = {};
    let argPipes = [];
    if (isPipe(optionsOrPipe)) {
      argPipes = [optionsOrPipe].concat(pipes);
    } else {
      options = optionsOrPipe || {};
      argPipes = pipes;
    }
    return [propertyKey, options, argPipes];
  }

  const isArgsOptionsObject =
    isObject(propertyOrOptionsOrPipe) &&
    !isFunction((propertyOrOptionsOrPipe as PipeTransform).transform);
  if (isArgsOptionsObject) {
    const argOptions = propertyOrOptionsOrPipe as ArgsOptions;
    const propertyKey = argOptions.name;
    const argPipes = optionsOrPipe ? [optionsOrPipe].concat(pipes) : pipes;

    return [
      propertyKey,
      argOptions,
      argPipes as (Type<PipeTransform> | PipeTransform)[],
    ];
  }

  // concatenate all pipes
  let argPipes = [propertyOrOptionsOrPipe];
  if (optionsOrPipe) {
    argPipes = argPipes.concat(optionsOrPipe);
  }
  argPipes = argPipes.concat(pipes);

  return [undefined, {}, argPipes as (Type<PipeTransform> | PipeTransform)[]];
}
