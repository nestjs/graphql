import { Injectable } from '@nestjs/common';
import { GraphQLNamedType } from 'graphql';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage';

@Injectable()
export class OrphanedTypesFactory {
  constructor(
    private readonly typeDefinitionsStorage: TypeDefinitionsStorage,
  ) {}

  public create(types: Function[]): GraphQLNamedType[] {
    if (!types || (types && types.length === 0)) {
      return [];
    }
    const interfaceTypeDefs = this.typeDefinitionsStorage.getAllInterfaceDefinitions();
    const objectTypeDefs = this.typeDefinitionsStorage.getAllObjectTypeDefinitions();
    const inputTypeDefs = this.typeDefinitionsStorage.getAllObjectTypeDefinitions();
    const classTypeDefs = [
      ...interfaceTypeDefs,
      ...objectTypeDefs,
      ...inputTypeDefs,
    ];
    return classTypeDefs
      .filter(item => !item.isAbstract && types.includes(item.target))
      .map(({ type }) => type);
  }
}
