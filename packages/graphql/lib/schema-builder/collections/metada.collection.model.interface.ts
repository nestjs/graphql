import { ClassMetadata, ResolverClassMetadata } from '../metadata';
import { ObjectTypeMetadata } from '../metadata/object-type.metadata';

export interface MetadataCollectionModelInterface {
  argumentType: ClassMetadata[];
  interface: ClassMetadata[];
  inputType: ClassMetadata[];
  objectType: ObjectTypeMetadata[];
  resolver: ResolverClassMetadata[];
  classDirectives: [];
  classExtensions: [];
  fieldDirectives: [];
  fieldExtensions: [];
}
