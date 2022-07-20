import { FieldDirectiveCollection } from '../../../lib/schema-builder/collections/';
import { PropertyDirectiveMetadata } from '../../../lib/schema-builder/metadata';

describe('FieldDirectiveCollection', () => {
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
    const map = new FieldDirectiveCollection();
    map.add(directive1);
    map.add(directive2);
    map.add(directive3);

    expect([...map.sdls]).toEqual(['@foo', '@bar', '@baz']);
  });

  it('should keep a list of all fieldName added', () => {
    const map = new FieldDirectiveCollection();
    map.add(directive1);
    map.add(directive2);
    map.add(directive3);

    expect([...map.fieldNames]).toEqual(['foo', 'bar', 'baz']);
  });

  it('should add 2 different directives on the same field', () => {
    const map = new FieldDirectiveCollection();
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
    const map = new FieldDirectiveCollection();
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
    const map = new FieldDirectiveCollection();
    map.add(directive1);
    map.add(directive1);

    const directives = map.getByName('foo');

    expect(directives).toEqual([directive1]);
    expect(directives.length).toEqual(1);
  });
});
