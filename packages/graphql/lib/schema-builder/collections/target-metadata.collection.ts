import {
  ClassDirectiveMetadata,
  ClassExtensionsMetadata,
  ClassMetadata,
  MethodArgsMetadata,
  PropertyExtensionsMetadata,
  PropertyMetadata,
  ResolverClassMetadata,
} from '../metadata/index.js';
import { ObjectTypeMetadata } from '../metadata/object-type.metadata.js';
import { ArrayWithGlobalCacheCollection } from './array-with-global-cache.collection.js';
import { FieldDirectiveCollection } from './field-directive.collection.js';
import { MetadataCollectionModel } from './metada-collection-model.interface.js';
import { MetadataByNameCollection } from './metadata-by-name.collection.js';
import { MetadataListByNameCollection } from './metadata-list-by-name.collection.js';

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
    this.replaceOrPush(this.all.argumentType, this._argumentType, val);
    this._argumentType = val;
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
    this.replaceOrPush(this.all.inputType, this._inputType, val);
    this._inputType = val;
  }

  get inputType() {
    return this._inputType;
  }

  set objectType(val: ObjectTypeMetadata) {
    this.replaceOrPush(this.all.objectType, this._objectType, val);
    this._objectType = val;
  }

  get objectType() {
    return this._objectType;
  }

  set resolver(val: ResolverClassMetadata) {
    this.replaceOrPush(this.all.resolver, this._resolver, val);
    this._resolver = val;
  }

  get resolver() {
    return this._resolver;
  }

  private replaceOrPush<T>(list: T[], previous: T | undefined, next: T) {
    if (previous === undefined) {
      list.push(next);
      return;
    }
    const index = list.indexOf(previous);
    if (index === -1) {
      list.push(next);
    } else {
      list[index] = next;
    }
  }
}
