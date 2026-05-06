import { Injectable } from '@nestjs/common';
import { GraphQLNamedType } from 'graphql';
import { OrphanedReferenceRegistry } from '../services/orphaned-reference.registry.js';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage.js';
import { getInterfacesArray } from '../utils/get-interfaces-array.util.js';
import { ObjectTypeDefinition } from './object-type-definition.factory.js';

@Injectable()
export class OrphanedTypesFactory {
  constructor(
    private readonly typeDefinitionsStorage: TypeDefinitionsStorage,
    private readonly orphanedReferenceRegistry: OrphanedReferenceRegistry,
  ) {}

  public create(types: (Function | object)[]): GraphQLNamedType[] {
    types = (types || []).concat(this.orphanedReferenceRegistry.getAll());

    if (types.length === 0) {
      return [];
    }
    const interfaceTypeDefs =
      this.typeDefinitionsStorage.getAllInterfaceDefinitions();
    const objectTypeDefs =
      this.typeDefinitionsStorage.getAllObjectTypeDefinitions();
    const inputTypeDefs =
      this.typeDefinitionsStorage.getAllInputTypeDefinitions();
    const classTypeDefs = [
      ...interfaceTypeDefs,
      ...objectTypeDefs,
      ...inputTypeDefs,
    ];

    const enumTypeDefs =
      this.typeDefinitionsStorage.getAllEnumTypeDefinitions();

    return [
      ...classTypeDefs
        .filter((item) => !item.isAbstract)
        .filter((item: ObjectTypeDefinition) => {
          const implementsReferencedInterface = getInterfacesArray(
            item.interfaces,
          ).some((i) => types.includes(i));
          return types.includes(item.target) || implementsReferencedInterface;
        })
        .map(({ type }) => type),
      ...enumTypeDefs
        .filter((item) => types.includes(item.enumRef))
        .map(({ type }) => type),
    ];
  }
}
