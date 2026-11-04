import 'reflect-metadata';
import { Args, Context, Parent } from '../../lib/decorators/index.js';
import { PARAM_ARGS_METADATA } from '../../lib/graphql.constants.js';

describe('GraphQL param decorators', () => {
  const getParams = (target: Function, key: string) =>
    Object.keys(Reflect.getMetadata(PARAM_ARGS_METADATA, target, key)).sort();

  class BaseResolver {
    notes(@Args('cursor') _cursor: string) {
      return [];
    }

    profile(@Args('id') _id: string, @Context() _context: object) {
      return {};
    }
  }

  it('should replace the entry an override inherits at the same index', () => {
    class UserResolver extends BaseResolver {
      override notes(@Parent() _user: object, @Args('cursor') _cursor: string) {
        return [];
      }
    }

    // "@Parent()" at 0 and "@Args()" at 1, without the "@Args()" inherited at 0
    expect(getParams(UserResolver, 'notes')).toEqual(['0:0', '3:1']);
  });

  it('should replace the entry an override inherits when the decorator takes pipes', () => {
    class UserResolver extends BaseResolver {
      override profile(@Context() _context: object, @Args('id') _id: string) {
        return {};
      }
    }

    expect(getParams(UserResolver, 'profile')).toEqual(['1:0', '3:1']);
  });

  it('should keep the entries an override does not redeclare', () => {
    class UserResolver extends BaseResolver {
      override profile(@Args('id') _id: string, _context: object) {
        return {};
      }
    }

    expect(getParams(UserResolver, 'profile')).toEqual(['1:1', '3:0']);
  });

  it('should leave the entries of the base method untouched', () => {
    class UserResolver extends BaseResolver {
      override notes(@Parent() _user: object) {
        return [];
      }
    }

    expect(getParams(UserResolver, 'notes')).toEqual(['0:0']);
    expect(getParams(BaseResolver, 'notes')).toEqual(['3:0']);
  });
});
