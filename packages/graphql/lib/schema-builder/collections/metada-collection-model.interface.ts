import {
  ClassDirectiveMetadata,
  ClassExtensionsMetadata,
  ClassMetadata,
  PropertyDirectiveMetadata,
  PropertyExtensionsMetadata,
  ResolverClassMetadata,
} from '../metadata/index.js';
import { ObjectTypeMetadata } from '../metadata/object-type.metadata.js';

export interface MetadataCollectionModel {
  argumentType: ClassMetadata[];
  interface: Map<Function, ClassMetadata>;
  inputType: ClassMetadata[];
  objectType: ObjectTypeMetadata[];
  resolver: ResolverClassMetadata[];
  classDirectives: ClassDirectiveMetadata[];
  classExtensions: ClassExtensionsMetadata[];
  fieldDirectives: PropertyDirectiveMetadata[];
  fieldExtensions: PropertyExtensionsMetadata[];
}
