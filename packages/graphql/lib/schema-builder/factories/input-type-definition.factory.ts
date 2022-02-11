import { Injectable, Type } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import { GraphQLInputFieldConfigMap, GraphQLInputObjectType } from 'graphql';
import { BuildSchemaOptions } from '../../interfaces';
import { getDefaultValue } from '../helpers/get-default-value.helper';
import { ClassMetadata } from '../metadata';
import { TypeFieldsAccessor } from '../services/type-fields.accessor';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage';
import { AstDefinitionNodeFactory } from './ast-definition-node.factory';
import { InputTypeFactory } from './input-type.factory';

export interface InputTypeDefinition {
  target: Function;
  type: GraphQLInputObjectType;
  isAbstract: boolean;
}

@Injectable()
export class InputTypeDefinitionFactory {
  constructor(
    private readonly typeDefinitionsStorage: TypeDefinitionsStorage,
    private readonly inputTypeFactory: InputTypeFactory,
    private readonly typeFieldsAccessor: TypeFieldsAccessor,
    private readonly astDefinitionNodeFactory: AstDefinitionNodeFactory,
  ) {}

  public create(
    metadata: ClassMetadata,
    options: BuildSchemaOptions,
  ): InputTypeDefinition {
    return {
      target: metadata.target,
      isAbstract: metadata.isAbstract || false,
      type: new GraphQLInputObjectType({
        name: metadata.name,
        description: metadata.description,
        fields: this.generateFields(metadata, options),
        /**
         * AST node has to be manually created in order to define directives
         * (more on this topic here: https://github.com/graphql/graphql-js/issues/1343)
         */
        astNode: this.astDefinitionNodeFactory.createInputObjectTypeNode(
          metadata.name,
          metadata.directives,
        ),
        extensions: metadata.extensions,
      }),
    };
  }

  private generateFields(
    metadata: ClassMetadata,
    options: BuildSchemaOptions,
  ): () => GraphQLInputFieldConfigMap {
    const instance = new (metadata.target as Type<any>)();
    const prototype = Object.getPrototypeOf(metadata.target);

    const getParentType = () => {
      const parentTypeDefinition =
        this.typeDefinitionsStorage.getInputTypeByTarget(prototype);
      return parentTypeDefinition ? parentTypeDefinition.type : undefined;
    };
    return () => {
      let fields: GraphQLInputFieldConfigMap = {};
      metadata.properties.forEach((property) => {
        property.options.defaultValue = getDefaultValue(
          instance,
          property.options,
          property.name,
          metadata.name,
        );

        const type = this.inputTypeFactory.create(
          property.name,
          property.typeFn(),
          options,
          property.options,
        );
        fields[property.schemaName] = {
          description: property.description,
          type,
          defaultValue: property.options.defaultValue,
          /**
           * AST node has to be manually created in order to define directives
           * (more on this topic here: https://github.com/graphql/graphql-js/issues/1343)
           */
          astNode: this.astDefinitionNodeFactory.createInputValueNode(
            property.name,
            type,
            property.directives,
          ),
          extensions: metadata.extensions,
        };
      });

      if (!isUndefined(prototype.prototype)) {
        const parentClassRef = getParentType();
        if (parentClassRef) {
          const parentFields =
            this.typeFieldsAccessor.extractFromInputType(parentClassRef);
          fields = {
            ...parentFields,
            ...fields,
          };
        }
      }
      return fields;
    };
  }
}
