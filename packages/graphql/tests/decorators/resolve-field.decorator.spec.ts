import 'reflect-metadata';
import { ObjectType, Resolver, ResolveField, Field } from '../../lib/index.js';
import { RESOLVER_NAME_METADATA } from '../../lib/graphql.constants.js';

/**
 * The schema field name is derived from the decorator options, while the
 * resolver map is keyed off `RESOLVER_NAME_METADATA`. Both have to agree,
 * otherwise the field is exposed without a resolver attached to it.
 */
describe('@ResolveField decorator', () => {
  @ObjectType()
  class Author {
    @Field(() => String)
    firstName!: string;
  }

  it('should propagate "name" given as the only argument', () => {
    @Resolver(() => Author)
    class AuthorResolver {
      @ResolveField({ name: 'posts' })
      getPosts() {
        return [];
      }
    }

    expect(
      Reflect.getMetadata(
        RESOLVER_NAME_METADATA,
        AuthorResolver.prototype.getPosts,
      ),
    ).toEqual('posts');
  });

  it('should propagate "name" given alongside a type function', () => {
    @Resolver(() => Author)
    class AuthorResolver {
      @ResolveField(() => [String], { name: 'posts' })
      getPosts() {
        return [];
      }
    }

    expect(
      Reflect.getMetadata(
        RESOLVER_NAME_METADATA,
        AuthorResolver.prototype.getPosts,
      ),
    ).toEqual('posts');
  });

  it('should fall back to the method name when no "name" is given', () => {
    @Resolver(() => Author)
    class AuthorResolver {
      @ResolveField(() => [String])
      posts() {
        return [];
      }
    }

    expect(
      Reflect.getMetadata(
        RESOLVER_NAME_METADATA,
        AuthorResolver.prototype.posts,
      ),
    ).toBeUndefined();
  });
});
