import { MetadataStorageCollection } from './metadata.storage.collection';
import { MetadataCollectionModelInterface } from './metada.collection.model.interface';

export class MetadataStorageCollectionList {
  private storageMap = new Map<Function, MetadataStorageCollection>();
  private storageList = new Array<MetadataStorageCollection>();

  public all: MetadataCollectionModelInterface = {
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
    let metadata = this.storageMap.get(target);

    if (!metadata) {
      metadata = new MetadataStorageCollection(this.all);
      this.storageMap.set(target, metadata);
      this.storageList.push(metadata);
    }

    return metadata;
  }

  compile() {
    this.reversePredicate((t) => t.classDirectives.getAll());
    this.reversePredicate((t) => t.classExtensions.getAll());
    this.reversePredicate((t) => t.fieldDirectives.getAll());
    this.reversePredicate((t) => t.fieldExtensions.getAll());
  }

  private reversePredicate<V>(
    predicate: (t: MetadataStorageCollection) => Array<V>,
  ) {
    this.storageList.forEach((t) => predicate(t).reverse());
  }
}
