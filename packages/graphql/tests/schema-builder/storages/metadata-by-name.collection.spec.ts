import { MetadataByNameCollection } from '../../../lib/schema-builder/collections/';

describe('MetadataByNameCollection', () => {
  it('should not add multiple values under the same name', () => {
    const map = new MetadataByNameCollection<string>();
    map.add('foo', 'uniqueName1');
    map.add('bar', 'uniqueName2');
    map.add('baz', 'uniqueName1');

    expect(map.getByName('uniqueName1')).toBe('foo');
    expect(map.getByName('uniqueName2')).toBe('bar');
    expect(map.getAll().length).toBe(2);
  });

  it('should not add multiple values under the same name even in reverse', () => {
    const map = new MetadataByNameCollection<string>();
    map.unshift('foo', 'uniqueName1');
    map.unshift('bar', 'uniqueName2');
    map.unshift('baz', 'uniqueName1');

    expect(map.getByName('uniqueName1')).toBe('foo');
    expect(map.getByName('uniqueName2')).toBe('bar');
    expect(map.getAll().length).toBe(2);
  });

  it('should add items in reverse', () => {
    const map = new MetadataByNameCollection<string>();
    map.add('foo', 'uniqueName1');
    map.unshift('bar', 'uniqueName2');

    const [first, second] = map.getAll();

    expect(first).toBe('bar');
    expect(second).toBe('foo');
  });
});
