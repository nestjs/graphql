import { GraphQLUnionType } from 'graphql';
import { UnionMetadata } from '../metadata';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage';
import { ResolveTypeFactory } from './resolve-type.factory';
export interface UnionDefinition {
  id: symbol;
  type: GraphQLUnionType;
}
export declare class UnionDefinitionFactory {
  private readonly resolveTypeFactory;
  private readonly typeDefinitionsStorage;
  constructor(
    resolveTypeFactory: ResolveTypeFactory,
    typeDefinitionsStorage: TypeDefinitionsStorage,
  );
  create(metadata: UnionMetadata): UnionDefinition;
  private createResolveTypeFn;
}
