import { PipeTransform, Type } from '@nestjs/common';
import { isObject, isString } from '@nestjs/common/utils/shared.utils';
import 'reflect-metadata';
import { GqlParamtype } from '../enums/gql-paramtype.enum';
import { BaseTypeOptions } from '../interfaces';
import { LazyMetadataStorage } from '../schema-builder/storages/lazy-metadata.storage';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage';
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
  type: () => any;
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
  propertyOrOptions?:
    | string
    | (Type<PipeTransform> | PipeTransform)
    | ArgsOptions,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator {
  let typeFn = undefined;
  let argOptions = {} as Omit<ArgsOptions, 'type'>;
  let property = propertyOrOptions;

  if (
    propertyOrOptions &&
    isObject(propertyOrOptions) &&
    !(propertyOrOptions as PipeTransform).transform
  ) {
    property = (propertyOrOptions as Record<string, any>).name;
    typeFn = (propertyOrOptions as Record<string, any>).type;

    const basicOptions = propertyOrOptions as ArgsOptions;
    argOptions = {
      description: basicOptions.description,
      nullable: basicOptions.nullable,
      defaultValue: basicOptions.defaultValue,
    };
  }

  return (target: Object, key: string, index: number) => {
    addPipesMetadata(GqlParamtype.ARGS, property, pipes, target, key, index);

    LazyMetadataStorage.store(() => {
      const { typeFn: reflectedTypeFn, options } = reflectTypeFromMetadata({
        metadataKey: 'design:paramtypes',
        prototype: target,
        propertyKey: key,
        index: index,
        explicitTypeFn: typeFn,
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
