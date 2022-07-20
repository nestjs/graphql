export class MetadataByNameCollection<T> {
  protected internalCollection = new Map<string, T>();
  protected all: (T extends any[] ? T[number] : T)[] = [];

  getAll() {
    return this.all;
  }

  getByName(name: string) {
    return this.internalCollection.get(name);
  }

  add(value: T extends any[] ? T[number] : T, name: string) {
    if (this.internalCollection.has(name)) {
      return;
    }

    this.internalCollection.set(name, value);
    this.all.push(value);
  }

  unshift(value: T extends any[] ? T[number] : T, name: string) {
    if (this.internalCollection.has(name)) {
      return;
    }
    this.internalCollection.set(name, value);
    this.all.unshift(value);
  }
}
