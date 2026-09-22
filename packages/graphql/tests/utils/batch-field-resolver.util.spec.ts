import {
  createBatchFieldResolver,
  loadDataLoaderPackage,
  mapBatchResultToParents,
} from '../../lib/utils/batch-field-resolver.util.js';

describe('mapBatchResultToParents', () => {
  const parents = [{ id: 1 }, { id: 2 }];

  it('should look the parents up in a "Map" keyed by the parents themselves', () => {
    const result = new Map<object, string>([
      [parents[1], 'second'],
      [parents[0], 'first'],
    ]);
    expect(mapBatchResultToParents(result, parents, undefined, 'test')).toEqual(
      ['first', 'second'],
    );
  });

  it('should look the parents up by "keyBy" when it is given', () => {
    const result = new Map<number, string>([
      [1, 'first'],
      [2, 'second'],
    ]);
    expect(
      mapBatchResultToParents(
        result,
        parents,
        (parent: { id: number }) => parent.id,
        'test',
      ),
    ).toEqual(['first', 'second']);
  });

  it('should resolve parents missing from the "Map" to undefined', () => {
    const result = new Map<object, string>([[parents[0], 'first']]);
    expect(mapBatchResultToParents(result, parents, undefined, 'test')).toEqual(
      ['first', undefined],
    );
  });

  it('should pass an array of the expected length straight through', () => {
    const result = ['first', 'second'];
    expect(mapBatchResultToParents(result, parents, undefined, 'test')).toBe(
      result,
    );
  });

  it('should throw when the returned array does not hold one entry per parent', () => {
    expect(() =>
      mapBatchResultToParents(['first'], parents, undefined, 'test'),
    ).toThrow(/returned 1 value\(s\) for 2 parent\(s\)/);
  });

  it('should throw when the batch method returns neither a "Map" nor an array', () => {
    expect(() =>
      mapBatchResultToParents({ nope: true }, parents, undefined, 'test'),
    ).toThrow(/must return either a "Map"/);
  });

  it('should throw when the batch method returns nothing', () => {
    expect(() =>
      mapBatchResultToParents(undefined, parents, undefined, 'test'),
    ).toThrow(/Received "undefined"/);
  });
});

describe('createBatchFieldResolver', () => {
  const parents = [{ id: 1 }, { id: 2 }, { id: 3 }];

  beforeAll(async () => {
    // Makes the loaders be created synchronously, exactly as they are once the
    // schema has been built.
    await loadDataLoaderPackage();
  });

  it('should hand every parent of the same tick over to a single call', async () => {
    const batchFn = vi.fn((batchedParents: { id: number }[]) =>
      batchedParents.map((parent) => `value-${parent.id}`),
    );
    const resolver = createBatchFieldResolver(batchFn, { name: 'test' });
    const context = {};

    const values = await Promise.all(
      parents.map((parent) => resolver(parent, {}, context, {})),
    );

    expect(values).toEqual(['value-1', 'value-2', 'value-3']);
    expect(batchFn).toHaveBeenCalledTimes(1);
    expect(batchFn.mock.calls[0][0]).toEqual(parents);
  });

  it('should forward the arguments, context and info of the batch', async () => {
    const batchFn = vi.fn((batchedParents: unknown[]) =>
      batchedParents.map(() => 'value'),
    );
    const resolver = createBatchFieldResolver(batchFn, { name: 'test' });
    const args = { first: 10 };
    const context = { requestId: 'abc' };
    const info = { fieldName: 'test' };

    await resolver(parents[0], args, context, info);

    expect(batchFn).toHaveBeenCalledWith([parents[0]], args, context, info);
  });

  it('should keep the loaders of separate requests apart', async () => {
    const batchFn = vi.fn((batchedParents: unknown[]) =>
      batchedParents.map(() => 'value'),
    );
    const resolver = createBatchFieldResolver(batchFn, { name: 'test' });

    await Promise.all([
      resolver(parents[0], {}, {}, {}),
      resolver(parents[1], {}, {}, {}),
    ]);

    expect(batchFn).toHaveBeenCalledTimes(2);
  });

  it('should not batch parents requested with different arguments together', async () => {
    const batchFn = vi.fn((batchedParents: unknown[]) =>
      batchedParents.map(() => 'value'),
    );
    const resolver = createBatchFieldResolver(batchFn, { name: 'test' });
    const context = {};

    await Promise.all([
      resolver(parents[0], { locale: 'en' }, context, {}),
      resolver(parents[1], { locale: 'en' }, context, {}),
      resolver(parents[2], { locale: 'pt' }, context, {}),
    ]);

    expect(batchFn).toHaveBeenCalledTimes(2);
    expect(batchFn).toHaveBeenCalledWith(
      [parents[0], parents[1]],
      { locale: 'en' },
      context,
      {},
    );
    expect(batchFn).toHaveBeenCalledWith(
      [parents[2]],
      { locale: 'pt' },
      context,
      {},
    );
  });

  it('should memoize the value resolved for a given parent within a request', async () => {
    const batchFn = vi.fn((batchedParents: { id: number }[]) =>
      batchedParents.map((parent) => `value-${parent.id}`),
    );
    const resolver = createBatchFieldResolver(batchFn, { name: 'test' });
    const context = {};

    const [first, second] = await Promise.all([
      resolver(parents[0], {}, context, {}),
      resolver(parents[0], {}, context, {}),
    ]);

    expect(first).toEqual('value-1');
    expect(second).toEqual('value-1');
    expect(batchFn.mock.calls[0][0]).toEqual([parents[0]]);
  });

  it('should forward the options to the underlying loader', async () => {
    const batchFn = vi.fn((batchedParents: unknown[]) =>
      batchedParents.map(() => 'value'),
    );
    const resolver = createBatchFieldResolver(batchFn, {
      name: 'test',
      dataLoader: { maxBatchSize: 2 },
    });
    const context = {};

    await Promise.all(
      parents.map((parent) => resolver(parent, {}, context, {})),
    );

    expect(batchFn).toHaveBeenCalledTimes(2);
    expect(batchFn.mock.calls[0][0]).toEqual([parents[0], parents[1]]);
    expect(batchFn.mock.calls[1][0]).toEqual([parents[2]]);
  });

  it('should reject every parent of a batch when the batch method throws', async () => {
    const batchFn = vi.fn(() => {
      throw new Error('boom');
    });
    const resolver = createBatchFieldResolver(batchFn, { name: 'test' });
    const context = {};

    await expect(
      Promise.all(parents.map((parent) => resolver(parent, {}, context, {}))),
    ).rejects.toThrow('boom');
    expect(batchFn).toHaveBeenCalledTimes(1);
  });

  it('should reject only the parents an "Error" was returned for', async () => {
    const batchFn = vi.fn((batchedParents: { id: number }[]) =>
      batchedParents.map((parent) =>
        parent.id === 2 ? new Error('nope') : `value-${parent.id}`,
      ),
    );
    const resolver = createBatchFieldResolver(batchFn, { name: 'test' });
    const context = {};

    const settled = await Promise.allSettled(
      parents.map((parent) => resolver(parent, {}, context, {})),
    );

    expect(settled.map((entry) => entry.status)).toEqual([
      'fulfilled',
      'rejected',
      'fulfilled',
    ]);
    expect((settled[1] as PromiseRejectedResult).reason.message).toEqual(
      'nope',
    );
    expect((settled[0] as PromiseFulfilledResult<string>).value).toEqual(
      'value-1',
    );
    expect(batchFn).toHaveBeenCalledTimes(1);
  });

  it('should fall back to a loader of its own when there is no context object', async () => {
    const batchFn = vi.fn((batchedParents: unknown[]) =>
      batchedParents.map(() => 'value'),
    );
    const resolver = createBatchFieldResolver(batchFn, { name: 'test' });

    await Promise.all([
      resolver(parents[0], {}, undefined, {}),
      resolver(parents[1], {}, undefined, {}),
    ]);

    expect(batchFn).toHaveBeenCalledTimes(2);
  });

  it('should fall back to a loader of its own when the arguments cannot be serialized', async () => {
    const batchFn = vi.fn((batchedParents: unknown[]) =>
      batchedParents.map(() => 'value'),
    );
    const resolver = createBatchFieldResolver(batchFn, { name: 'test' });
    const context = {};
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    await Promise.all([
      resolver(parents[0], circular, context, {}),
      resolver(parents[1], circular, context, {}),
    ]);

    expect(batchFn).toHaveBeenCalledTimes(2);
  });
});
