import {
  ClassDirectiveMetadata,
  ClassExtensionsMetadata,
  ClassMetadata,
  MethodArgsMetadata,
  PropertyDirectiveMetadata,
  PropertyExtensionsMetadata,
  PropertyMetadata,
  ResolverClassMetadata,
} from '../metadata';
import { ObjectTypeMetadata } from '../metadata/object-type.metadata';

export class MapByName<T> {
  protected map = new Map<string, T>();
  protected all: (T extends any[] ? T[number] : T)[] = [];

  getAll() {
    return this.all;
  }

  getByName(name: string) {
    return this.map.get(name);
  }

  add(value: T extends any[] ? T[number] : T, name: string) {
    if (this.map.has(name)) return;

    this.map.set(name, value);
    this.all.push(value);
  }

  unshift(value: T extends any[] ? T[number] : T, name: string) {
    if (this.map.has(name)) return;

    this.map.set(name, value);
    this.all.unshift(value);
  }
}

export class MapArrayByName<T> extends MapByName<T[]> {
  constructor(protected globalArray: Array<T> = null) {
    super();
  }

  getByName(name: string): T[] {
    return super.getByName(name) || [];
  }

  add(value: T, name: string) {
    let arrayResult = super.getByName(name);
    if (!arrayResult) {
      arrayResult = [];
      this.map.set(name, arrayResult);
    }

    arrayResult.push(value);
    this.all.push(value);
    this.globalArray && this.globalArray.push(value);
  }

  unshift(value: T, name: string) {
    let arrayResult = super.getByName(name);
    if (!arrayResult) {
      arrayResult = [];
      this.map.set(name, arrayResult);
    }

    arrayResult.unshift(value);
    this.all.push(value);
    this.globalArray && this.globalArray.unshift(value);
  }
}

export class FieldDirectiveMap extends MapArrayByName<PropertyDirectiveMetadata> {
  sdls = new Set<string>();
  fieldNames = new Set<string>();

  add(value: PropertyDirectiveMetadata) {
    if (this.sdls.has(value.sdl) && this.fieldNames.has(value.fieldName))
      return;

    super.add(value, value.fieldName);

    this.sdls.add(value.sdl);
    this.fieldNames.add(value.fieldName);
    this.globalArray && this.globalArray.push(value);
  }
}

class ArrayWithGlobalValues<T> extends Array<T> {
  constructor(private globalArray: Array<T>) {
    super();
  }

  push(...items): number {
    this.globalArray.push(...items);
    return super.push(...items);
  }

  unshift(...items): number {
    this.globalArray.unshift(...items);
    return super.unshift(...items);
  }
}

export class TypeMetadataStorageModel {
  constructor(private all: AllMetadata) {}

  fields = new MapByName<PropertyMetadata>();
  params = new MapArrayByName<MethodArgsMetadata>();
  fieldDirectives = new FieldDirectiveMap(this.all.fieldDirectives);
  fieldExtensions = new MapArrayByName<PropertyExtensionsMetadata>(
    this.all.fieldExtensions,
  );
  classDirectives = new ArrayWithGlobalValues<ClassDirectiveMetadata>(
    this.all.classDirectives,
  );
  classExtensions = new ArrayWithGlobalValues<ClassExtensionsMetadata>(
    this.all.classExtensions,
  );

  set argumentType(val: ClassMetadata) {
    this._argumentType = val;
    this.all.argumentType.push(val);
  }
  get argumentType() {
    return this._argumentType;
  }

  set interface(val: ClassMetadata) {
    this._interface = val;
    this.all.interface.push(val);
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

  _argumentType: ClassMetadata;
  _interface: ClassMetadata;
  _inputType: ClassMetadata;
  _objectType: ObjectTypeMetadata;
  _resolver: ResolverClassMetadata;
}

interface AllMetadata {
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

export class TypeMetadataStorageModelList {
  private map = new Map<Function, TypeMetadataStorageModel>();
  private array = new Array<TypeMetadataStorageModel>();

  public all: AllMetadata = {
    argumentType: [],
    interface: [],
    inputType: [],
    objectType: [],
    resolver: [],
    classDirectives: [],
    classExtensions: [],
    fieldDirectives: [],
    fieldExtensions: [],
  };

  get(target: Function) {
    let metadata = this.map.get(target);

    if (!metadata) {
      metadata = new TypeMetadataStorageModel(this.all);
      this.map.set(target, metadata);
      this.array.push(metadata);
    }

    return metadata;
  }

  compile() {
    this.all.classDirectives.reverse();
    this.all.classExtensions.reverse();
    this.all.fieldDirectives.reverse();
    this.all.fieldExtensions.reverse();
  }
}
