import { MetadataListByNameCollection } from '../../../lib/schema-builder/collections/';

describe('MapArrayByName', () => {
  it('should return an empty array if a name is not found', () => {
    const map = new MetadataListByNameCollection<string>();
    const possibleArray = map.getByName('unknown');
    expect(Array.isArray(possibleArray)).toBe(true);
    expect(possibleArray.length).toBe(0);
  });

  it('should continuously add values to an array', () => {
    const map = new MetadataListByNameCollection<string>();
    map.add('foo', 'uniqueName1');
    map.add('baz', 'uniqueName1');
    map.add('bar', 'uniqueName2');

    const uniqueName1Value = map.getByName('uniqueName1');
    const uniqueName2Value = map.getByName('uniqueName2');

    expect(uniqueName1Value).toEqual(['foo', 'baz']);
    expect(uniqueName2Value).toEqual(['bar']);
  });

  it('should return a flat array of all values', () => {
    const map = new MetadataListByNameCollection<string>();
    map.add('foo', 'uniqueName1');
    map.add('baz', 'uniqueName1');
    map.add('bar', 'uniqueName2');

    const allValues = map.getAll();

    expect(allValues).toEqual(['foo', 'baz', 'bar']);
  });
});
