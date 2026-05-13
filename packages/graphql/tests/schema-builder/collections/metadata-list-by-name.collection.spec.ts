import { MetadataListByNameCollection } from '../../../lib/schema-builder/collections/metadata-list-by-name.collection';

describe('MetadataListByNameCollection', () => {
  it('should keep getAll() in declaration order when items are added', () => {
    const collection = new MetadataListByNameCollection<number>();
    collection.add(1, 'a');
    collection.add(2, 'b');
    collection.add(3, 'c');

    expect(collection.getAll()).toEqual([1, 2, 3]);
  });

  it('should keep getAll() in reverse-declaration order when items are unshifted, matching the per-name array', () => {
    const collection = new MetadataListByNameCollection<number>();
    collection.unshift(1, 'a');
    collection.unshift(2, 'b');
    collection.unshift(3, 'c');

    expect(collection.getByName('a')).toEqual([1]);
    expect(collection.getByName('b')).toEqual([2]);
    expect(collection.getByName('c')).toEqual([3]);

    expect(collection.getAll()).toEqual([3, 2, 1]);
  });

  it('should mirror unshift order into the optional global array', () => {
    const globalArray: number[] = [];
    const collection = new MetadataListByNameCollection<number>(globalArray);
    collection.unshift(1, 'a');
    collection.unshift(2, 'b');
    collection.unshift(3, 'c');

    expect(globalArray).toEqual([3, 2, 1]);
    expect(collection.getAll()).toEqual([3, 2, 1]);
  });
});
