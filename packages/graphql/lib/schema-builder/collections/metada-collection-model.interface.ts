import {
  ClassDirectiveMetadata,
  ClassExtensionsMetadata,
  ClassMetadata,
  PropertyDirectiveMetadata,
  PropertyExtensionsMetadata,
  ResolverClassMetadata,
} from '../metadata';
import { ObjectTypeMetadata } from '../metadata/object-type.metadata';

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
