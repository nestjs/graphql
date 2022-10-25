import { Injectable } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import {
  GraphQLFieldConfigMap,
  GraphQLInterfaceType,
  GraphQLObjectType,
} from 'graphql';
import { BuildSchemaOptions } from '../../interfaces';
import { ReturnTypeCannotBeResolvedError } from '../errors/return-type-cannot-be-resolved.error';
import { InterfaceMetadata } from '../metadata/interface.metadata';
import { OrphanedReferenceRegistry } from '../services/orphaned-reference.registry';
import { TypeFieldsAccessor } from '../services/type-fields.accessor';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage';
import { TypeMetadataStorage } from '../storages/type-metadata.storage';
import { getInterfacesArray } from '../utils/get-interfaces-array.util';
import { ArgsFactory } from './args.factory';
import { AstDefinitionNodeFactory } from './ast-definition-node.factory';
import { OutputTypeFactory } from './output-type.factory';
import { ResolveTypeFactory } from './resolve-type.factory';

export interface InterfaceTypeDefinition {
  target: Function;
  type: GraphQLInterfaceType;
  isAbstract: boolean;
  interfaces: Function[];
}

@Injectable()
export class InterfaceDefinitionFactory {
  constructor(
    private readonly resolveTypeFactory: ResolveTypeFactory,
    private readonly typeDefinitionsStorage: TypeDefinitionsStorage,
    private readonly outputTypeFactory: OutputTypeFactory,
    private readonly orphanedReferenceRegistry: OrphanedReferenceRegistry,
    private readonly typeFieldsAccessor: TypeFieldsAccessor,
    private readonly argsFactory: ArgsFactory,
    private readonly astDefinitionNodeFactory: AstDefinitionNodeFactory,
  ) {}

  public create(
    metadata: InterfaceMetadata,
    options: BuildSchemaOptions,
  ): InterfaceTypeDefinition {
    const prototype = Object.getPrototypeOf(metadata.target);
    const getParentType = () => {
      const parentTypeDefinition =
        this.typeDefinitionsStorage.getObjectTypeByTarget(prototype) ||
        this.typeDefinitionsStorage.getInterfaceByTarget(prototype);
      return parentTypeDefinition ? parentTypeDefinition.type : undefined;
    };
    const resolveType = this.createResolveTypeFn(metadata);
    return {
      target: metadata.target,
      isAbstract: metadata.isAbstract || false,
      interfaces: getInterfacesArray(metadata.interfaces),
      type: new GraphQLInterfaceType({
        name: metadata.name,
        description: metadata.description,
        fields: this.generateFields(metadata, options),
        interfaces: this.generateInterfaces(metadata, getParentType),
        resolveType,
        /**
         * AST node has to be manually created in order to define directives
         * (more on this topic here: https://github.com/graphql/graphql-js/issues/1343)
         */
        astNode: this.astDefinitionNodeFactory.createInterfaceTypeNode(
          metadata.name,
          metadata.directives,
        ),
      }),
    };
  }

  private createResolveTypeFn(metadata: InterfaceMetadata) {
    const objectTypesMetadata = TypeMetadataStorage.getObjectTypesMetadata();
    const implementedTypes = objectTypesMetadata
      .filter((objectType) => {
        const interfaces = getInterfacesArray(objectType.interfaces);
        return interfaces.includes(metadata.target);
      })
      .map((objectType) => objectType.target);

    return metadata.resolveType
      ? this.resolveTypeFactory.getResolveTypeFunction(metadata.resolveType)
      : (instance: any) => {
          const target = implementedTypes.find(
            (Type) => instance instanceof Type,
          );
          if (!target) {
            if (Reflect.has(instance, '__typename')) {
              return instance.__typename;
            }
            throw new ReturnTypeCannotBeResolvedError(metadata.name);
          }
          return this.typeDefinitionsStorage.getObjectTypeByTarget(target).type
            ?.name;
        };
  }

  private generateFields(
    metadata: InterfaceMetadata,
    options: BuildSchemaOptions,
  ): () => GraphQLFieldConfigMap<any, any> {
    const prototype = Object.getPrototypeOf(metadata.target);
    metadata.properties.forEach(({ typeFn }) =>
      this.orphanedReferenceRegistry.addToRegistryIfOrphaned(typeFn()),
    );
    const getParentType = () => {
      const parentTypeDefinition =
        this.typeDefinitionsStorage.getInterfaceByTarget(prototype);
      return parentTypeDefinition ? parentTypeDefinition.type : undefined;
    };

    return () => {
      let fields: GraphQLFieldConfigMap<any, any> = {};

      let properties = [];
      if (metadata.interfaces) {
        const implementedInterfaces =
          TypeMetadataStorage.getInterfacesMetadata()
            .filter((it) =>
              getInterfacesArray(metadata.interfaces).includes(it.target),
            )
            .map((it) => it.properties);
        implementedInterfaces.forEach((fields) =>
          properties.push(...(fields || [])),
        );
      }
      properties = properties.concat(metadata.properties);

      properties.forEach((field) => {
        const type = this.outputTypeFactory.create(
          field.name,
          field.typeFn(),
          options,
          field.options,
        );
        fields[field.schemaName] = {
          description: field.description,
          type,
          args: this.argsFactory.create(field.methodArgs, options),
          resolve: (root: object) => {
            const value = root[field.name];
            return typeof value === 'undefined'
              ? field.options.defaultValue
              : value;
          },
          deprecationReason: field.deprecationReason,
          /**
           * AST node has to be manually created in order to define directives
           * (more on this topic here: https://github.com/graphql/graphql-js/issues/1343)
           */
          astNode: this.astDefinitionNodeFactory.createFieldNode(
            field.name,
            type,
            field.directives,
          ),
          extensions: {
            complexity: field.complexity,
            ...field.extensions,
          },
        };
      });

      if (!isUndefined(prototype.prototype)) {
        const parentClassRef = getParentType();
        if (parentClassRef) {
          const parentFields =
            this.typeFieldsAccessor.extractFromInterfaceOrObjectType(
              parentClassRef,
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

  private generateInterfaces(
    metadata: InterfaceMetadata,
    getParentType: () => GraphQLObjectType | GraphQLInterfaceType,
  ) {
    const prototype = Object.getPrototypeOf(metadata.target);

    return () => {
      const interfaces: GraphQLInterfaceType[] = getInterfacesArray(
        metadata.interfaces,
      ).map(
        (item: Function) =>
          this.typeDefinitionsStorage.getInterfaceByTarget(item).type,
      );
      if (!isUndefined(prototype)) {
        const parentClass = getParentType();
        if (!parentClass) {
          return interfaces;
        }
        const parentInterfaces = parentClass.getInterfaces?.() ?? [];
        return Array.from(new Set([...interfaces, ...parentInterfaces]));
      }
      return interfaces;
    };
  }
}
