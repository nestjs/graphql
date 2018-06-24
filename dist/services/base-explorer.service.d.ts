import { ResolverMetadata } from '../interfaces/resolver-metadata.interface';
export declare class BaseExplorerService {
  flatMap<T = ResolverMetadata[]>(
    modules: Map<any, any>[],
    callback: (instance: any) => T,
  ): any;
  groupMetadata(resolvers: ResolverMetadata[]): any;
}
