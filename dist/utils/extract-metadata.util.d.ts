import 'reflect-metadata';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface';
export declare function extractMetadata(
  instance: any,
  prototype: any,
  methodName: string,
  filterPredicate: (resolverType: string, isDelegated: boolean) => boolean,
): ResolverMetadata;
