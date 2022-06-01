export class MetadataByNameCollection<T> {
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
