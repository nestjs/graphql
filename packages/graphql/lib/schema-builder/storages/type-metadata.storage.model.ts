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
import { InterfaceMetadata } from '../metadata/interface.metadata';
import { ObjectTypeMetadata } from '../metadata/object-type.metadata';

export class MapByName<T> {
  protected map = new Map<string, T>();
  protected all: T[] = [];

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
  getByName(name: string): T[] {
    return super.getByName(name) || [];
  }

  add(value: T[] extends any[] ? T[][number] : T[], name: string) {
    let arrayResult = this.map.get(name);
    if (!arrayResult) {
      arrayResult = [];
      this.map.set(name, arrayResult);
    }

    arrayResult.push(value);
    this.all.push(value);
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
  }
}

export class TypeMetadataStorageModel {
  fieldDirectives = new FieldDirectiveMap();
  fieldExtensions = new MapArrayByName<PropertyExtensionsMetadata>();
  fields = new MapByName<PropertyMetadata>();
  params = new MapArrayByName<MethodArgsMetadata>();
  classDirectives = new Array<ClassDirectiveMetadata>();
  classExtensions = new Array<ClassExtensionsMetadata>();
  argumentType: ClassMetadata;
  interface: InterfaceMetadata;
  inputType: ClassMetadata;
  objectType: ObjectTypeMetadata;
  resolver: ResolverClassMetadata;
}

export class TypeMetadataStorageModelList {
  private map = new Map<Function, TypeMetadataStorageModel>();
  private array = new Array<TypeMetadataStorageModel>();

  get(target: Function) {
    let metadata = this.map.get(target);

    if (!metadata) {
      metadata = new TypeMetadataStorageModel();
      this.map.set(target, metadata);
      this.array.push(metadata);
    }

    return metadata;
  }

  private getAllWithoutNullsByPredicate<V>(
    predicate: (t: TypeMetadataStorageModel) => V,
  ) {
    return this.array.reduce((prev, curr) => {
      const val = predicate(curr);
      if (val) prev.push(val);
      return prev;
    }, new Array<V>());
  }

  getAll() {
    return {
      argumentType: () =>
        this.getAllWithoutNullsByPredicate((t) => t.argumentType),
      interface: () => this.getAllWithoutNullsByPredicate((t) => t.interface),
      inputType: () => this.getAllWithoutNullsByPredicate((t) => t.inputType),
      objectType: () => this.getAllWithoutNullsByPredicate((t) => t.objectType),
      resolver: () => this.getAllWithoutNullsByPredicate((t) => t.resolver),
      classDirectives: () => this.array.flatMap((t) => t.classDirectives),
      classExtensions: () => this.array.flatMap((t) => t.classExtensions),
      fieldDirectives: () =>
        this.array.flatMap((t) => t.fieldDirectives.getAll()),
      fieldExtensions: () =>
        this.array.flatMap((t) => t.fieldExtensions.getAll()),
    };
  }
}
