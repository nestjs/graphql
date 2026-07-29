import { Logger } from '@nestjs/common';

import { Query, Resolver, TypeMetadataStorage } from '../../../lib';
import { LazyMetadataStorage } from '../../../lib/schema-builder/storages/lazy-metadata.storage';

/**
 * Two resolvers on separate branches extending the same base is ambiguous: the base's handlers can
 * only be attributed to one of them. That resolves by registration order, so warn about the one
 * that silently misses out.
 */

@Resolver()
class SharedBaseResolver {
  @Query(() => String)
  sharedQuery(): string {
    return 'shared';
  }
}

@Resolver()
class FirstDerivedResolver extends SharedBaseResolver {}

@Resolver()
class SecondDerivedResolver extends SharedBaseResolver {}

describe('TypeMetadataStorage extended resolvers - shared base class', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    LazyMetadataStorage.load([
      SharedBaseResolver,
      FirstDerivedResolver,
      SecondDerivedResolver,
    ]);
    TypeMetadataStorage.compile();
  });

  afterAll(() => {
    warn.mockRestore();
    TypeMetadataStorage.clear();
  });

  it('should attribute the handlers to the resolver registered first', () => {
    const query = TypeMetadataStorage.getQueriesMetadata().find(
      (item) => item.schemaName === 'sharedQuery',
    );

    expect(query?.target).toBe(FirstDerivedResolver);
  });

  it('should warn that the other resolver never serves the handlers', () => {
    const messages = warn.mock.calls.map(([message]) => String(message));
    const message = messages.find((text) =>
      text.includes('SharedBaseResolver'),
    );

    expect(message).toBeDefined();
    expect(message).toContain('FirstDerivedResolver');
    expect(message).toContain('SecondDerivedResolver');
  });
});
