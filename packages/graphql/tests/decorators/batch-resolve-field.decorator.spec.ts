import 'reflect-metadata';
import { BatchFieldMetadata } from '../../lib/decorators/batch-resolve-field.decorator.js';
import {
  BATCH_RESOLVER_METADATA,
  RESOLVER_NAME_METADATA,
  RESOLVER_PROPERTY_METADATA,
} from '../../lib/graphql.constants.js';
import { LazyMetadataStorage } from '../../lib/schema-builder/storages/lazy-metadata.storage.js';
import {
  BatchResolveField,
  Field,
  ObjectType,
  Resolver,
} from '../../lib/index.js';

describe('@BatchResolveField decorator', () => {
  @ObjectType()
  class Post {
    @Field(() => String)
    title!: string;
  }

  @ObjectType()
  class Author {
    @Field(() => String)
    firstName!: string;
  }

  it('should mark the method as a property resolver', () => {
    @Resolver(() => Post)
    class PostResolver {
      @BatchResolveField(() => Author)
      author() {
        return new Map();
      }
    }

    expect(
      Reflect.getMetadata(
        RESOLVER_PROPERTY_METADATA,
        PostResolver.prototype.author,
      ),
    ).toBe(true);
  });

  it('should fall back to the method name when no "name" is given', () => {
    @Resolver(() => Post)
    class PostResolver {
      @BatchResolveField(() => Author)
      author() {
        return new Map();
      }
    }

    expect(
      Reflect.getMetadata(
        RESOLVER_NAME_METADATA,
        PostResolver.prototype.author,
      ),
    ).toBeUndefined();
  });

  it('should propagate "name" given through the options', () => {
    @Resolver(() => Post)
    class PostResolver {
      @BatchResolveField(() => Author, { name: 'author' })
      getAuthor() {
        return new Map();
      }
    }

    expect(
      Reflect.getMetadata(
        RESOLVER_NAME_METADATA,
        PostResolver.prototype.getAuthor,
      ),
    ).toEqual('author');
  });

  it('should propagate "name" given as the first argument', () => {
    @Resolver(() => Post)
    class PostResolver {
      @BatchResolveField('author', () => Author)
      getAuthor() {
        return new Map();
      }
    }

    expect(
      Reflect.getMetadata(
        RESOLVER_NAME_METADATA,
        PostResolver.prototype.getAuthor,
      ),
    ).toEqual('author');
  });

  it('should store the batching options', () => {
    const keyBy = (post: Post) => post.title;

    @Resolver(() => Post)
    class PostResolver {
      @BatchResolveField(() => Author, {
        keyBy,
        dataLoader: { maxBatchSize: 25 },
      })
      author() {
        return new Map();
      }
    }

    const metadata: BatchFieldMetadata = Reflect.getMetadata(
      BATCH_RESOLVER_METADATA,
      PostResolver.prototype.author,
    );
    expect(metadata).toEqual({ keyBy, dataLoader: { maxBatchSize: 25 } });
  });

  it('should not leave batching metadata on regular methods', () => {
    @Resolver(() => Post)
    class PostResolver {
      author() {
        return null;
      }
    }

    expect(
      Reflect.getMetadata(
        BATCH_RESOLVER_METADATA,
        PostResolver.prototype.author,
      ),
    ).toBeUndefined();
  });

  it('should require an explicit type function when the schema is built', () => {
    @Resolver(() => Post)
    class PostResolver {
      @BatchResolveField()
      author() {
        return new Map();
      }
    }

    expect(() =>
      LazyMetadataStorage.load([PostResolver], {
        skipFieldLazyMetadata: true,
      }),
    ).toThrow(/must declare an explicit type function/);
  });
});
