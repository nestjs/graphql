import { Injectable } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import { GraphQLFieldConfigMap, GraphQLInterfaceType } from 'graphql';
import { BuildSchemaOptions } from '../../interfaces';
import { ReturnTypeCannotBeResolvedError } from '../errors/return-type-cannot-be-resolved.error';
import { InterfaceMetadata } from '../metadata/interface.metadata';
import { TypeFieldsAccessor } from '../services/type-fields.accessor';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage';
import { TypeMetadataStorage } from '../storages/type-metadata.storage';
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
    private readonly typeFieldsAccessor: TypeFieldsAccessor,
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
      .filter(
        objectType =>
          objectType.interfaces &&
          objectType.interfaces.includes(metadata.target),
      )
      .map(objectType => objectType.target);

    return metadata.resolveType
      ? this.resolveTypeFactory.getResolveTypeFunction(metadata.resolveType)
      : (instance: any) => {
          const target = implementedTypes.find(
            Type => instance instanceof Type,
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
    const getParentType = () => {
      const parentTypeDefinition = this.typeDefinitionsStorage.getInterfaceByTarget(
        prototype,
      );
      return parentTypeDefinition ? parentTypeDefinition.type : undefined;
    };

    return () => {
      let fields: GraphQLFieldConfigMap<any, any> = {};
      metadata.properties.forEach(property => {
        fields[property.schemaName] = {
          description: property.description,
          type: this.outputTypeFactory.create(
            property.name,
            property.typeFn(),
            options,
            property.options,
          ),
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
