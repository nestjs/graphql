export class LazyMetadataStorageHost {
  private readonly storage: Function[] = [];

  store(fn: Function) {
    this.storage.push(fn);
  }

  load() {
    this.storage.forEach(fn => fn());
  }
}

export const lazyMetadataStorage = new LazyMetadataStorageHost();
