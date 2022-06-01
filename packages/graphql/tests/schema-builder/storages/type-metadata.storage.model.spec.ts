import {
  FieldDirectiveMap,
  MapArrayByName,
  MapByName,
} from '../../../lib/schema-builder/storages/type-metadata.storage.model';
import { PropertyDirectiveMetadata } from '../../../lib/schema-builder/metadata';

describe('TypeMetadataStorageModel', () => {
  describe('MapByName', () => {
    it('should not add multiple values under the same name', () => {
      const map = new MapByName<string>();
      map.add('foo', 'uniqueName1');
      map.add('bar', 'uniqueName2');
      map.add('baz', 'uniqueName1');

      expect(map.getByName('uniqueName1')).toBe('foo');
      expect(map.getByName('uniqueName2')).toBe('bar');
      expect(map.getAll().length).toBe(2);
    });

    it('should not add multiple values under the same name even in reverse', () => {
      const map = new MapByName<string>();
      map.unshift('foo', 'uniqueName1');
      map.unshift('bar', 'uniqueName2');
      map.unshift('baz', 'uniqueName1');

      expect(map.getByName('uniqueName1')).toBe('foo');
      expect(map.getByName('uniqueName2')).toBe('bar');
      expect(map.getAll().length).toBe(2);
    });

    it('should add items in reverse', () => {
      const map = new MapByName<string>();
      map.add('foo', 'uniqueName1');
      map.unshift('bar', 'uniqueName2');

      const [first, second] = map.getAll();

      expect(first).toBe('bar');
      expect(second).toBe('foo');
    });
  });

  describe('MapArrayByName', () => {
    it('should return an empty array if a name is not found', () => {
      const map = new MapArrayByName<string>();
      const possibleArray = map.getByName('unknown');
      expect(Array.isArray(possibleArray)).toBe(true);
      expect(possibleArray.length).toBe(0);
    });

    it('should continuously add values to an array', () => {
      const map = new MapArrayByName<string>();
      map.add('foo', 'uniqueName1');
      map.add('baz', 'uniqueName1');
      map.add('bar', 'uniqueName2');

      const uniqueName1Value = map.getByName('uniqueName1');
      const uniqueName2Value = map.getByName('uniqueName2');

      expect(uniqueName1Value).toEqual(['foo', 'baz']);
      expect(uniqueName2Value).toEqual(['bar']);
    });

    it('should return a flat array of all values', () => {
      const map = new MapArrayByName<string>();
      map.add('foo', 'uniqueName1');
      map.add('baz', 'uniqueName1');
      map.add('bar', 'uniqueName2');

      const allValues = map.getAll();

      expect(allValues).toEqual(['foo', 'baz', 'bar']);
    });
  });

  describe('FieldDirectiveMap', () => {
    const directive1: PropertyDirectiveMetadata = {
      fieldName: 'foo',
      sdl: '@foo',
      target: () => {},
    };
    const directive2: PropertyDirectiveMetadata = {
      fieldName: 'bar',
      sdl: '@bar',
      target: () => {},
    };
    const directive3: PropertyDirectiveMetadata = {
      fieldName: 'baz',
      sdl: '@baz',
      target: () => {},
    };

    it('should keep a list of all SDLs added', () => {
      const map = new FieldDirectiveMap();
      map.add(directive1);
      map.add(directive2);
      map.add(directive3);

      expect([...map.sdls]).toEqual(['@foo', '@bar', '@baz']);
    });

    it('should keep a list of all fieldName added', () => {
      const map = new FieldDirectiveMap();
      map.add(directive1);
      map.add(directive2);
      map.add(directive3);

      expect([...map.fieldNames]).toEqual(['foo', 'bar', 'baz']);
    });

    it('should add 2 different directives on the same field', () => {
      const map = new FieldDirectiveMap();
      const directive1Alt: PropertyDirectiveMetadata = {
        fieldName: 'foo',
        sdl: '@bar',
        target: () => {},
      };
      map.add(directive1);
      map.add(directive1Alt);

      expect(map.getByName('foo')).toEqual([directive1, directive1Alt]);
    });

    it('should add 2 different fields with the same directive', () => {
      const map = new FieldDirectiveMap();
      const directive1Alt: PropertyDirectiveMetadata = {
        fieldName: 'bar',
        sdl: '@foo',
        target: () => {},
      };
      map.add(directive1);
      map.add(directive1Alt);

      expect(map.getByName('foo')).toEqual([directive1]);
      expect(map.getByName('bar')).toEqual([directive1Alt]);
    });

    it('should NOT the same directive on the same field twice', () => {
      const map = new FieldDirectiveMap();
      map.add(directive1);
      map.add(directive1);

      const directives = map.getByName('foo');

      expect(directives).toEqual([directive1]);
      expect(directives.length).toEqual(1);
    });
  });
});
