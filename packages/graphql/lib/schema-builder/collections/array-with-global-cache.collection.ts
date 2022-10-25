export class ArrayWithGlobalCacheCollection<T> {
  private readonly internalArray: T[] = [];

  constructor(private globalArray: Array<T>) {}

  getAll() {
    return this.internalArray;
  }

  push(...items: T[]): number {
    this.globalArray.push(...items);
    return this.internalArray.push(...items);
  }

  unshift(...items: T[]): number {
    this.globalArray.unshift(...items);
    return this.internalArray.unshift(...items);
  }

  reverse() {
    return this.internalArray.reverse();
  }

  reduce<U>(
    callbackfn: (
      previousValue: U,
      currentValue: T,
      currentIndex: number,
      array: T[],
    ) => U,
    initialValue: U,
  ): U {
    return this.internalArray.reduce(callbackfn, initialValue);
  }
}
