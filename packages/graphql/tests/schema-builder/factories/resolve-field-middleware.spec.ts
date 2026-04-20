import { ResolveField } from '../../../lib/decorators';
import {
  FIELD_RESOLVER_MIDDLEWARE_METADATA,
  RESOLVER_NAME_METADATA,
  RESOLVER_PROPERTY_METADATA,
} from '../../../lib/graphql.constants';
import { FieldMiddleware } from '../../../lib/interfaces';

const trimMiddleware: FieldMiddleware = async (_ctx, next) => {
  const value = (await next()) as string;
  return value?.trim();
};

describe('ResolveField field middleware metadata', () => {
  it('should preserve middleware when called with a typeFunc and options', () => {
    class WithTypeFn {
      @ResolveField(() => String, { middleware: [trimMiddleware] })
      sample() {
        return '  sample  ';
      }
    }

    const middleware = Reflect.getMetadata(
      FIELD_RESOLVER_MIDDLEWARE_METADATA,
      WithTypeFn.prototype.sample,
    );
    const name = Reflect.getMetadata(
      RESOLVER_NAME_METADATA,
      WithTypeFn.prototype.sample,
    );
    const isProperty = Reflect.getMetadata(
      RESOLVER_PROPERTY_METADATA,
      WithTypeFn.prototype.sample,
    );

    expect(isProperty).toBe(true);
    expect(name).toBeUndefined();
    expect(middleware).toEqual([trimMiddleware]);
  });

  it('should preserve middleware when called with options only (no typeFunc)', () => {
    class WithoutTypeFn {
      @ResolveField({ middleware: [trimMiddleware] })
      sample() {
        return '  sample  ';
      }
    }

    const middleware = Reflect.getMetadata(
      FIELD_RESOLVER_MIDDLEWARE_METADATA,
      WithoutTypeFn.prototype.sample,
    );
    const name = Reflect.getMetadata(
      RESOLVER_NAME_METADATA,
      WithoutTypeFn.prototype.sample,
    );
    const isProperty = Reflect.getMetadata(
      RESOLVER_PROPERTY_METADATA,
      WithoutTypeFn.prototype.sample,
    );

    expect(isProperty).toBe(true);
    expect(name).toBeUndefined();
    expect(middleware).toEqual([trimMiddleware]);
  });

  it('should preserve middleware when called with propertyName and options (no typeFunc)', () => {
    class WithNameOnly {
      @ResolveField('aliased', { middleware: [trimMiddleware] })
      sample() {
        return '  sample  ';
      }
    }

    const middleware = Reflect.getMetadata(
      FIELD_RESOLVER_MIDDLEWARE_METADATA,
      WithNameOnly.prototype.sample,
    );
    const name = Reflect.getMetadata(
      RESOLVER_NAME_METADATA,
      WithNameOnly.prototype.sample,
    );

    expect(name).toBe('aliased');
    expect(middleware).toEqual([trimMiddleware]);
  });
});
