import { GraphQLNamedType } from 'graphql';
import { OrphanedReferenceRegistry } from '../services/orphaned-reference.registry';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage';
export declare class OrphanedTypesFactory {
  private readonly typeDefinitionsStorage;
  private readonly orphanedReferenceRegistry;
  constructor(
    typeDefinitionsStorage: TypeDefinitionsStorage,
    orphanedReferenceRegistry: OrphanedReferenceRegistry,
  );
  create(types: Function[]): GraphQLNamedType[];
}
