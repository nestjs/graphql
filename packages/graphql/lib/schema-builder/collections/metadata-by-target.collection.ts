import { MetadataCollectionModel } from './metada-collection-model.interface';
import { TargetMetadataCollection } from './target-metadata.collection';
import { ClassMetadata } from '../metadata';

export class MetadataByTargetCollection {
  public readonly all: MetadataCollectionModel = {
    argumentType: [],
    interface: new Map<Function, ClassMetadata>(),
    inputType: [],
    objectType: [],
    resolver: [],
    classDirectives: [],
    classExtensions: [],
    fieldDirectives: [],
    fieldExtensions: [],
  };

  private readonly storageMap = new Map<Function, TargetMetadataCollection>();
  private readonly storageList = new Array<TargetMetadataCollection>();

  get(target: Function) {
    let metadata = this.storageMap.get(target);

    if (!metadata) {
      metadata = new TargetMetadataCollection(this.all);
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
    predicate: (t: TargetMetadataCollection) => Array<V>,
  ) {
    this.storageList.forEach((t) => predicate(t).reverse());
  }
}
