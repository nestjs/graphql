import { Injectable, Type } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils.js';
import {
  GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLOneOfDirective,
  InputObjectTypeDefinitionNode,
} from 'graphql';
import { BuildSchemaOptions } from '../../interfaces/index.js';
import { getDefaultValue } from '../helpers/get-default-value.helper.js';
import { mergeInheritedFields } from '../helpers/merge-inherited-fields.helper.js';
import { normalizeEnumDefaultValue } from '../helpers/normalize-enum-default-value.helper.js';
import { ClassMetadata } from '../metadata/index.js';
import { TypeFieldsAccessor } from '../services/type-fields.accessor.js';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage.js';
import { TypeMetadataStorage } from '../storages/type-metadata.storage.js';
import { AstDefinitionNodeFactory } from './ast-definition-node.factory.js';
import { InputTypeFactory } from './input-type.factory.js';

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
    /**
     * AST node has to be manually created in order to define directives
     * (more on this topic here: https://github.com/graphql/graphql-js/issues/1343)
     */
    const astNode = this.astDefinitionNodeFactory.createInputObjectTypeNode(
      metadata.name,
      metadata.directives,
    );
    return {
      target: metadata.target,
      isAbstract: metadata.isAbstract || false,
      type: new GraphQLInputObjectType({
        name: metadata.name,
        description: metadata.description,
        isOneOf: this.isOneOf(metadata, astNode),
        fields: this.generateFields(metadata, options),
        astNode,
        extensions: metadata.extensions,
      }),
    };
  }

  /**
   * A derived input type inherits the fields of its parent input types and,
   * with them, the rule that exactly one of them is set: the nearest class
   * that sets the "isOneOf" option decides. The "@oneOf" directive (applied
   * with, and inherited like, any other `@Directive()`) has the same effect,
   * as graphql-js only reads it off the AST when it builds a schema from SDL.
   */
  private isOneOf(
    metadata: ClassMetadata,
    astNode: InputObjectTypeDefinitionNode | undefined,
  ): boolean | undefined {
    const hasOneOfDirective = !!astNode?.directives?.some(
      (directive) => directive.name.value === GraphQLOneOfDirective.name,
    );
    if (hasOneOfDirective) {
      return true;
    }
    return [metadata, ...this.getParentInputTypes(metadata)].find(
      (item) => !isUndefined(item.isOneOf),
    )?.isOneOf;
  }

  /**
   * Returns the input types the given one inherits its fields from, nearest
   * first (the chain stops at the first parent class that is not an input type).
   */
  private getParentInputTypes(metadata: ClassMetadata): ClassMetadata[] {
    const parents: ClassMetadata[] = [];
    let parent = TypeMetadataStorage.getInputTypeMetadataByTarget(
      Object.getPrototypeOf(metadata.target),
    );
    while (parent) {
      parents.push(parent);
      parent = TypeMetadataStorage.getInputTypeMetadataByTarget(
        Object.getPrototypeOf(parent.target),
      );
    }
    return parents;
  }

  /**
   * Schema names of the inherited fields of the properties the class
   * re-declares under another schema name. The nearest declaration of a
   * property wins, so these fields must not be inherited.
   */
  private getRedeclaredParentFields(metadata: ClassMetadata): string[] {
    const ownSchemaNames = new Map(
      metadata.properties.map((property) => [
        property.name,
        property.schemaName,
      ]),
    );
    const parentFields = mergeInheritedFields(
      this.getParentInputTypes(metadata)
        .reverse()
        .map((parent) => parent.properties ?? []),
    );
    return parentFields
      .filter(
        ({ name, schemaName }) =>
          ownSchemaNames.has(name) && ownSchemaNames.get(name) !== schemaName,
      )
      .map(({ schemaName }) => schemaName);
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

        const typeRef = property.typeFn();
        const type = this.inputTypeFactory.create(
          property.name,
          typeRef,
          options,
          property.options,
        );
        fields[property.schemaName] = {
          description: property.description,
          type,
          defaultValue: normalizeEnumDefaultValue(
            property.options.defaultValue,
            typeRef,
            TypeMetadataStorage.getEnumsMetadata(),
          ),
          deprecationReason: property.deprecationReason,
          /**
           * AST node has to be manually created in order to define directives
           * (more on this topic here: https://github.com/graphql/graphql-js/issues/1343)
           */
          astNode: this.astDefinitionNodeFactory.createInputValueNode(
            property.name,
            type,
            property.directives,
          ),
          extensions: property.extensions,
        };
      });

      if (!isUndefined(prototype.prototype)) {
        const parentClassRef = getParentType();
        if (parentClassRef) {
          const parentFields =
            this.typeFieldsAccessor.extractFromInputType(parentClassRef);
          this.getRedeclaredParentFields(metadata).forEach(
            (schemaName) => delete parentFields[schemaName],
          );
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
