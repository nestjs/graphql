import { Injectable } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import { GraphQLFieldConfigMap, GraphQLInterfaceType } from 'graphql';
import { BuildSchemaOptions } from '../../interfaces';
import { ReturnTypeCannotBeResolvedError } from '../errors/return-type-cannot-be-resolved.error';
import { InterfaceMetadata } from '../metadata/interface.metadata';
import { OrphanedReferenceRegistry } from '../services/orphaned-reference.registry';
import { TypeFieldsAccessor } from '../services/type-fields.accessor';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage';
import { TypeMetadataStorage } from '../storages/type-metadata.storage';
import { getInterfacesArray } from '../utils/get-interfaces-array.util';
import { ArgsFactory } from './args.factory';
import { OutputTypeFactory } from './output-type.factory';
import { ResolveTypeFactory } from './resolve-type.factory';

export interface InterfaceTypeDefinition {
  target: Function;
  type: GraphQLInterfaceType;
  isAbstract: boolean;
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
  ) {}

  public create(
    metadata: InterfaceMetadata,
    options: BuildSchemaOptions,
  ): InterfaceTypeDefinition {
    const resolveType = this.createResolveTypeFn(metadata);
    return {
      target: metadata.target,
      isAbstract: metadata.isAbstract || false,
      type: new GraphQLInterfaceType({
        name: metadata.name,
        description: metadata.description,
        fields: this.generateFields(metadata, options),
        resolveType,
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
            throw new ReturnTypeCannotBeResolvedError(metadata.name);
          }
          return this.typeDefinitionsStorage.getObjectTypeByTarget(target).type;
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
      const parentTypeDefinition = this.typeDefinitionsStorage.getInterfaceByTarget(
        prototype,
      );
      return parentTypeDefinition ? parentTypeDefinition.type : undefined;
    };

    return () => {
      let fields: GraphQLFieldConfigMap<any, any> = {};
      metadata.properties.forEach((field) => {
        fields[field.schemaName] = {
          description: field.description,
          type: this.outputTypeFactory.create(
            field.name,
            field.typeFn(),
            options,
            field.options,
          ),
          args: this.argsFactory.create(field.methodArgs, options),
          resolve: (root: object) => {
            const value = root[field.name];
            return typeof value === 'undefined'
              ? field.options.defaultValue
              : value;
          },
          deprecationReason: field.deprecationReason,
          extensions: {
            complexity: field.complexity,
            ...field.extensions,
          },
        };
      });

      if (!isUndefined(prototype.prototype)) {
        const parentClassRef = getParentType();
        if (parentClassRef) {
          const parentFields = this.typeFieldsAccessor.extractFromInterfaceOrObjectType(
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
}
