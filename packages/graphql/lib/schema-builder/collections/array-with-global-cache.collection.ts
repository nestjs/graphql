export class ArrayWithGlobalCacheCollection<T> {
  private readonly array: T[] = [];

  constructor(private globalArray: Array<T>) {}

  getAll() {
    return this.array;
  }

  push(...items): number {
    this.globalArray.push(...items);
    return this.array.push(...items);
  }

  unshift(...items): number {
    this.globalArray.unshift(...items);
    return this.array.unshift(...items);
  }

  reverse() {
    return this.array.reverse();
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
    return this.array.reduce(callbackfn, initialValue);
  }
}
