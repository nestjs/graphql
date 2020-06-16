import 'reflect-metadata';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface';
export declare function extractMetadata(
  instance: Record<string, any>,
  prototype: any,
  methodName: string,
  filterPredicate: (
    resolverType: string,
    isReferenceResolver?: boolean,
    isPropertyResolver?: boolean,
  ) => boolean,
): ResolverMetadata;
