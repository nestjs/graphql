import { GqlTypeReference } from '../../interfaces';
export declare class OrphanedReferenceRegistry {
  private readonly registry;
  addToRegistryIfOrphaned(typeRef: GqlTypeReference): void;
  getAll(): Function[];
}
