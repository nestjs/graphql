import { Injectable } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils.js';
import { isEqual } from 'es-toolkit';
import {
  GraphQLArgumentConfig,
  GraphQLFieldConfigArgumentMap,
  isEqualType,
} from 'graphql';
import { BuildSchemaOptions } from '../../interfaces/index.js';
import { CannotDetermineArgTypeError } from '../errors/cannot-determine-arg-type.error.js';
import { ConflictingArgsError } from '../errors/conflicting-args.error.js';
import { getDefaultValue } from '../helpers/get-default-value.helper.js';
import { mergeInheritedFields } from '../helpers/merge-inherited-fields.helper.js';
import { normalizeEnumDefaultValue } from '../helpers/normalize-enum-default-value.helper.js';
import {
  ClassMetadata,
  MethodArgsMetadata,
  PropertyMetadata,
} from '../metadata/index.js';
import { TypeMetadataStorage } from '../storages/type-metadata.storage.js';
import { InputTypeFactory } from './input-type.factory.js';
import { AstDefinitionNodeFactory } from './ast-definition-node.factory.js';

/**
 * An argument of a field, as declared by one `@Args()` parameter.
 */
interface ArgDeclaration {
  param: MethodArgsMetadata;
  schemaName: string;
  /**
   * Key the resolver reads the value from once the arguments have been mapped
   * to the property names of their `@ArgsType()` classes.
   */
  key: string;
  /**
   * Describes where the argument is declared, for error messages.
   */
  origin: string;
  config: GraphQLArgumentConfig;
}

@Injectable()
export class ArgsFactory {
  constructor(
    private readonly inputTypeFactory: InputTypeFactory,
    private readonly astDefinitionNodeFactory: AstDefinitionNodeFactory,
  ) {}

  public create(
    args: MethodArgsMetadata[],
    options: BuildSchemaOptions,
  ): GraphQLFieldConfigArgumentMap {
    const fieldConfigMap: GraphQLFieldConfigArgumentMap = {};
    const declarationsBySchemaName = new Map<string, ArgDeclaration>();
    const declarationsByKey = new Map<string, ArgDeclaration>();

    // Every parameter of a method reads from the same arguments object, so an
    // argument declared by several parameters must be declared identically,
    // and no two arguments may end up under the same key once the renamed
    // properties of the `@ArgsType()` classes are mapped back to their names.
    const addDeclaration = (declaration: ArgDeclaration) => {
      const { param, schemaName, key } = declaration;
      const host = `"${param.target.name}#${param.methodName}"`;

      const sameSchemaName = declarationsBySchemaName.get(schemaName);
      if (sameSchemaName && sameSchemaName.param !== param) {
        if (
          !isEqualType(sameSchemaName.config.type, declaration.config.type) ||
          !isEqual(
            sameSchemaName.config.defaultValue,
            declaration.config.defaultValue,
          )
        ) {
          throw new ConflictingArgsError(
            `Argument "${schemaName}" of ${host} is declared by more than one @Args() parameter with a different type or default value.`,
          );
        }
        if (sameSchemaName.key !== key) {
          throw new ConflictingArgsError(
            `Argument "${schemaName}" of ${host} is passed to the resolver both as the ${sameSchemaName.origin} and as the ${declaration.origin}.`,
          );
        }
      }
      const sameKey = declarationsByKey.get(key);
      if (
        sameKey &&
        sameKey.param !== param &&
        sameKey.schemaName !== schemaName
      ) {
        const [renamed, other] =
          declaration.schemaName !== key
            ? [declaration, sameKey]
            : [sameKey, declaration];
        throw new ConflictingArgsError(
          `The ${renamed.origin} is named like the ${other.origin} of ${host}, so both cannot be passed to the resolver.`,
        );
      }
      declarationsBySchemaName.set(schemaName, declaration);
      declarationsByKey.set(key, declaration);
      fieldConfigMap[schemaName] = declaration.config;
    };

    args.forEach((param) => {
      if (param.kind === 'arg') {
        const typeRef = param.typeFn();
        addDeclaration({
          param,
          schemaName: param.name,
          key: param.name,
          origin: `"${param.name}" argument`,
          config: {
            description: param.description,
            deprecationReason: param.deprecationReason,
            type: this.inputTypeFactory.create(
              param.name,
              typeRef,
              options,
              param.options,
            ),
            defaultValue: normalizeEnumDefaultValue(
              param.options.defaultValue,
              typeRef,
              TypeMetadataStorage.getEnumsMetadata(),
            ),
          },
        });
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

        // Farthest ancestor first, so that each class overrides what it
        // re-declares from the classes above it.
        const inheritanceChain = [argumentType];
        let parent = Object.getPrototypeOf(argumentType.target);
        while (!isUndefined(parent.prototype)) {
          const parentArgType = argumentTypes.find(
            (item) => item.target === parent,
          );
          if (parentArgType) {
            inheritanceChain.unshift(parentArgType);
          }
          parent = Object.getPrototypeOf(parent);
        }
        this.createInheritedArgs(inheritanceChain, options).forEach(
          ({ field, argType, config }) =>
            addDeclaration({
              param,
              schemaName: field.schemaName,
              key: field.name,
              origin:
                field.name === field.schemaName
                  ? `"${field.name}" property of "${argType.name}"`
                  : `"${field.name}" property of "${argType.name}" (exposed as "${field.schemaName}")`,
              config,
            }),
        );
      }
    });
    return fieldConfigMap;
  }

  private createInheritedArgs(
    inheritanceChain: ClassMetadata[],
    options: BuildSchemaOptions,
  ): {
    field: PropertyMetadata;
    argType: ClassMetadata;
    config: GraphQLArgumentConfig;
  }[] {
    const argTypeByField = new Map<PropertyMetadata, ClassMetadata>();
    const instanceByArgType = new Map<ClassMetadata, object>();
    inheritanceChain.forEach((argType) =>
      argType.properties.forEach((field) => argTypeByField.set(field, argType)),
    );

    const fields = mergeInheritedFields(
      inheritanceChain.map((argType) => argType.properties),
    );
    return fields.map((field) => {
      const argType = argTypeByField.get(field);
      if (!instanceByArgType.has(argType)) {
        instanceByArgType.set(argType, new (argType.target as any)());
      }
      field.options.defaultValue = getDefaultValue(
        instanceByArgType.get(argType),
        field.options,
        field.name,
        argType.name,
      );

      const typeRef = field.typeFn();
      const type = this.inputTypeFactory.create(
        field.name,
        typeRef,
        options,
        field.options,
      );
      return {
        field,
        argType,
        config: {
          description: field.description,
          deprecationReason: field.deprecationReason,
          type,
          defaultValue: normalizeEnumDefaultValue(
            field.options.defaultValue,
            typeRef,
            TypeMetadataStorage.getEnumsMetadata(),
          ),
          extensions: field.extensions,
          /**
           * AST node has to be manually created in order to define directives
           * (more on this topic here: https://github.com/graphql/graphql-js/issues/1343)
           */
          astNode: this.astDefinitionNodeFactory.createArgNode(
            field.name,
            type,
            field.directives,
          ),
        },
      };
    });
  }
}
