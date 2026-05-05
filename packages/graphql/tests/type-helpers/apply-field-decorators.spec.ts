import { applyFieldDecorators } from '../../lib/type-helpers/type-helpers.utils';
import { TypeMetadataStorage } from '../../lib';
import { LazyMetadataStorage } from '../../lib/schema-builder/storages/lazy-metadata.storage';

class Holder {
  field: string;
}

describe('applyFieldDecorators', () => {
  afterEach(() => {
    TypeMetadataStorage.clear();
  });

  it('should not register an Extensions metadata entry when item.extensions is empty', () => {
    applyFieldDecorators(Holder, {
      name: 'field',
      schemaName: 'field',
      typeFn: () => String,
      target: Holder,
      options: {},
      extensions: {},
    });
    LazyMetadataStorage.load([Holder]);

    const storage = TypeMetadataStorage as unknown as {
      metadataByTargetCollection: {
        get: (target: Function) => {
          fieldExtensions: { getByName: (name: string) => unknown[] };
        };
      };
    };
    const entries = storage.metadataByTargetCollection
      .get(Holder)
      .fieldExtensions.getByName('field');
    expect(entries).toEqual([]);
  });

  it('should register an Extensions metadata entry when item.extensions has keys', () => {
    applyFieldDecorators(Holder, {
      name: 'field',
      schemaName: 'field',
      typeFn: () => String,
      target: Holder,
      options: {},
      extensions: { audit: true },
    });
    LazyMetadataStorage.load([Holder]);

    const storage = TypeMetadataStorage as unknown as {
      metadataByTargetCollection: {
        get: (target: Function) => {
          fieldExtensions: {
            getByName: (
              name: string,
            ) => Array<{ value: Record<string, unknown> }>;
          };
        };
      };
    };
    const entries = storage.metadataByTargetCollection
      .get(Holder)
      .fieldExtensions.getByName('field');
    expect(entries).toHaveLength(1);
    expect(entries[0].value).toEqual({ audit: true });
  });
});
