import { MetadataByNameCollection } from './metadata-by-name.collection';

export class MetadataListByNameCollection<T> extends MetadataByNameCollection<
  T[]
> {
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
      this.internalCollection.set(name, arrayResult);
    }

    arrayResult.push(value);
    this.all.push(value);
    this.globalArray && this.globalArray.push(value);
  }

  unshift(value: T, name: string) {
    let arrayResult = super.getByName(name);
    if (!arrayResult) {
      arrayResult = [];
      this.internalCollection.set(name, arrayResult);
    }

    arrayResult.unshift(value);
    this.all.push(value);
    this.globalArray && this.globalArray.unshift(value);
  }
}
