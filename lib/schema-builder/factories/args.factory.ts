import { Injectable } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import { GraphQLFieldConfigArgumentMap } from 'graphql';
import { BuildSchemaOptions } from '../../interfaces';
import { CannotDetermineArgTypeError } from '../errors/cannot-determine-arg-type.error';
import { getDefaultValue } from '../helpers/get-default-value.helper';
import { ClassMetadata, MethodArgsMetadata } from '../metadata';
import { TypeMetadataStorage } from '../storages/type-metadata.storage';
import { InputTypeFactory } from './input-type.factory';

@Injectable()
export class ArgsFactory {
  constructor(private readonly inputTypeFactory: InputTypeFactory) {}

  public create(
    args: MethodArgsMetadata[],
    options: BuildSchemaOptions,
  ): GraphQLFieldConfigArgumentMap {
    const fieldConfigMap: GraphQLFieldConfigArgumentMap = {};
    args.forEach((param) => {
      if (param.kind === 'arg') {
        fieldConfigMap[param.name] = {
          description: param.description,
          type: this.inputTypeFactory.create(
            param.name,
            param.typeFn(),
            options,
            param.options,
          ),
          defaultValue: param.options.defaultValue,
        };
      } else if (param.kind === 'args') {
        const argumentTypes = TypeMetadataStorage.getArgumentsMetadata();
        const hostType = param.typeFn();
        const argumentType = argumentTypes.find(
          (item) => item.target === hostType,
        );
        if (!argumentType) {
          throw new CannotDetermineArgTypeError(
            (hostType as Function).name || (hostType as any),
            param,
          );
        }

        let parent = Object.getPrototypeOf(argumentType.target);
        while (!isUndefined(parent.prototype)) {
          const parentArgType = argumentTypes.find(
            (item) => item.target === parent,
          );
          if (parentArgType) {
            this.inheritParentArgs(parentArgType, options, fieldConfigMap);
          }
          parent = Object.getPrototypeOf(parent);
        }
        this.inheritParentArgs(argumentType, options, fieldConfigMap);
      }
    });
    return fieldConfigMap;
  }

  private inheritParentArgs(
    argType: ClassMetadata,
    options: BuildSchemaOptions,
    fieldConfigMap: GraphQLFieldConfigArgumentMap = {},
  ) {
    const argumentInstance = new (argType.target as any)();
    argType.properties.forEach((field) => {
      field.options.defaultValue = getDefaultValue(
        argumentInstance,
        field.options,
        field.name,
        argType.name,
      );

      const { schemaName } = field;
      fieldConfigMap[schemaName] = {
        description: field.description,
        type: this.inputTypeFactory.create(
          field.name,
          field.typeFn(),
          options,
          field.options,
        ),
        defaultValue: field.options.defaultValue,
      };
    });
  }
}
