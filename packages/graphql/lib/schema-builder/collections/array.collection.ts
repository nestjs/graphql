export class ArrayCollection<T> extends Array<T> {
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
