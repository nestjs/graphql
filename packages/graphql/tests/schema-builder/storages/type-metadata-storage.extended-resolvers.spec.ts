import { Query, Resolver, TypeMetadataStorage } from '../../../lib';
import { LazyMetadataStorage } from '../../../lib/schema-builder/storages/lazy-metadata.storage';

/**
 * Handlers declared on a base resolver are re-attributed to the class that extends it, so that the
 * resolvers explorer instantiates the derived class. The rewrite is applied in registration order
 * and can move the same handler more than once, which is what these cases pin down.
 */

@Resolver()
class BaseResolver {
  @Query(() => String)
  inheritedQuery(): string {
    return 'base';
  }
}

@Resolver()
class MidResolver extends BaseResolver {
  @Query(() => String)
  midQuery(): string {
    return 'mid';
  }
}

@Resolver()
class LeafResolver extends MidResolver {}

describe('TypeMetadataStorage extended resolvers', () => {
  beforeAll(() => {
    LazyMetadataStorage.load([BaseResolver, MidResolver, LeafResolver]);
    TypeMetadataStorage.compile();
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  const queryFor = (schemaName: string) =>
    TypeMetadataStorage.getQueriesMetadata().find(
      (query) => query.schemaName === schemaName,
    );

  it('should re-attribute a query declared on a base resolver to the derived resolver', () => {
    const query = queryFor('midQuery');

    expect(query?.target).toBe(LeafResolver);
    expect(query?.classMetadata?.target).toBe(LeafResolver);
  });

  it('should follow the whole chain when a resolver is extended more than once', () => {
    // inheritedQuery starts on BaseResolver, moves to MidResolver, then on to LeafResolver.
    const query = queryFor('inheritedQuery');

    expect(query?.target).toBe(LeafResolver);
    expect(query?.classMetadata?.target).toBe(LeafResolver);
  });
});
