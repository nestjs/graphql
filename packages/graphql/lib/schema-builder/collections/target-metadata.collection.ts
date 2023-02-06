import {
  ClassDirectiveMetadata,
  ClassExtensionsMetadata,
  ClassMetadata,
  MethodArgsMetadata,
  PropertyExtensionsMetadata,
  PropertyMetadata,
  ResolverClassMetadata,
} from '../metadata';
import { ObjectTypeMetadata } from '../metadata/object-type.metadata';
import { ArrayWithGlobalCacheCollection } from './array-with-global-cache.collection';
import { FieldDirectiveCollection } from './field-directive.collection';
import { MetadataCollectionModel } from './metada-collection-model.interface';
import { MetadataByNameCollection } from './metadata-by-name.collection';
import { MetadataListByNameCollection } from './metadata-list-by-name.collection';

export class TargetMetadataCollection {
  constructor(private readonly all: MetadataCollectionModel) {}

  fields = new MetadataByNameCollection<PropertyMetadata>();
  params = new MetadataListByNameCollection<MethodArgsMetadata>();
  fieldDirectives = new FieldDirectiveCollection(this.all.fieldDirectives);
  fieldExtensions =
    new MetadataListByNameCollection<PropertyExtensionsMetadata>(
      this.all.fieldExtensions,
    );
  classDirectives = new ArrayWithGlobalCacheCollection<ClassDirectiveMetadata>(
    this.all.classDirectives,
  );
  classExtensions = new ArrayWithGlobalCacheCollection<ClassExtensionsMetadata>(
    this.all.classExtensions,
  );

  private _argumentType: ClassMetadata;
  private _interface: ClassMetadata;
  private _inputType: ClassMetadata;
  private _objectType: ObjectTypeMetadata;
  private _resolver: ResolverClassMetadata;

  set argumentType(val: ClassMetadata) {
    this._argumentType = val;
    this.all.argumentType.push(val);
  }

  get argumentType() {
    return this._argumentType;
  }

  set interface(val: ClassMetadata) {
    this._interface = val;
    this.all.interface.set(val.target, val);
  }

  get interface() {
    return this._interface;
  }

  set inputType(val: ClassMetadata) {
    this._inputType = val;
    this.all.inputType.push(val);
  }

  get inputType() {
    return this._inputType;
  }

  set objectType(val: ObjectTypeMetadata) {
    this._objectType = val;
    this.all.objectType.push(val);
  }

  get objectType() {
    return this._objectType;
  }

  set resolver(val: ResolverClassMetadata) {
    this._resolver = val;
    this.all.resolver.push(val);
  }

  get resolver() {
    return this._resolver;
  }
}
