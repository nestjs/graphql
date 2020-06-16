import { GraphQLTypeResolver } from 'graphql';
import { ResolveTypeFn } from '../../interfaces';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage';
export declare class ResolveTypeFactory {
  private readonly typeDefinitionsStorage;
  constructor(typeDefinitionsStorage: TypeDefinitionsStorage);
  getResolveTypeFunction<TSource = any, TContext = any>(
    resolveType: ResolveTypeFn<TSource, TContext>,
  ): GraphQLTypeResolver<TSource, TContext>;
}
