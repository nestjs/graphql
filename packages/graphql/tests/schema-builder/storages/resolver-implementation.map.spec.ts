import { Logger } from '@nestjs/common';

import {
  FieldResolverMetadata,
  ResolverClassMetadata,
} from '../../../lib/schema-builder/metadata';
import { ResolverImplementationMap } from '../../../lib/schema-builder/storages/resolver-implementation.map';

const resolverFor = (target: Function): ResolverClassMetadata => ({
  target,
  typeFn: () => target,
});

const throwingResolverFor = (target: Function): ResolverClassMetadata => ({
  target,
  typeFn: () => {
    throw new Error(`cannot resolve type for ${target.name}`);
  },
});

const fieldResolverOn = (
  target: Function,
  objectTypeFn?: FieldResolverMetadata['objectTypeFn'],
): FieldResolverMetadata => ({
  target,
  methodName: 'field',
  schemaName: 'field',
  kind: 'internal',
  objectTypeFn,
});

const throwingObjectTypeFn = () => {
  throw new Error('cannot determine host type');
};

describe('ResolverImplementationMap', () => {
  describe('isEmpty', () => {
    it('should be true when no resolver extends anything', () => {
      class Standalone {}

      const map = new ResolverImplementationMap(
        [resolverFor(Standalone)],
        [[]],
      );

      expect(map.isEmpty).toBe(true);
    });
  });

  describe('getResolverImplementationForBaseClass', () => {
    it('should follow the chain down to the most derived resolver', () => {
      class BaseUserResolver {}
      class UserResolver extends BaseUserResolver {}
      class AdminUserResolver extends UserResolver {}

      const map = new ResolverImplementationMap(
        [resolverFor(UserResolver), resolverFor(AdminUserResolver)],
        [[]],
      );

      expect(
        map.getResolverImplementationForBaseClass(BaseUserResolver)?.target,
      ).toBe(AdminUserResolver);
    });

    it('should return undefined when nothing extends the class', () => {
      class UserResolver {}

      const map = new ResolverImplementationMap(
        [resolverFor(UserResolver)],
        [[]],
      );

      expect(
        map.getResolverImplementationForBaseClass(UserResolver),
      ).toBeUndefined();
    });
  });

  describe('collectFieldResolversMetadata', () => {
    it('should replace a throwing objectTypeFn with the owning resolver typeFn', () => {
      class BaseUserResolver {}
      class UserResolver extends BaseUserResolver {}
      const owner = resolverFor(UserResolver);

      const [compiled] = new ResolverImplementationMap(
        [owner],
        [[]],
      ).collectFieldResolversMetadata([
        fieldResolverOn(BaseUserResolver, throwingObjectTypeFn),
      ]);

      // the fallback comes from the resolver that now owns the handler, not from an unrelated one
      expect(compiled.objectTypeFn).toBe(owner.typeFn);
      expect(compiled.target).toBe(UserResolver);
    });

    it('should not borrow a typeFn from a resolver in an unrelated hierarchy', () => {
      class BaseUserResolver {}
      class UserResolver extends BaseUserResolver {}
      class BaseOrgResolver {}
      class OrgResolver extends BaseOrgResolver {}

      const userOwner = throwingResolverFor(UserResolver);
      const orgOwner = resolverFor(OrgResolver);

      const [compiled] = new ResolverImplementationMap(
        [userOwner, orgOwner],
        [[]],
      ).collectFieldResolversMetadata([
        fieldResolverOn(BaseUserResolver, throwingObjectTypeFn),
      ]);

      expect(compiled.objectTypeFn).toBe(userOwner.typeFn);
      expect(compiled.objectTypeFn).not.toBe(orgOwner.typeFn);
    });

    it('should keep an objectTypeFn that resolves, by reference', () => {
      class BaseUserResolver {}
      class UserResolver extends BaseUserResolver {}
      const objectTypeFn = () => BaseUserResolver;

      const [compiled] = new ResolverImplementationMap(
        [resolverFor(UserResolver)],
        [[]],
      ).collectFieldResolversMetadata([
        fieldResolverOn(BaseUserResolver, objectTypeFn),
      ]);

      expect(compiled.objectTypeFn).toBe(objectTypeFn);
    });

    it('should leave a handler with no owning resolver untouched', () => {
      class BaseUserResolver {}
      class UserResolver extends BaseUserResolver {}
      class Unrelated {}
      const entry = fieldResolverOn(Unrelated, throwingObjectTypeFn);

      const [compiled] = new ResolverImplementationMap(
        [resolverFor(UserResolver)],
        [[]],
      ).collectFieldResolversMetadata([entry]);

      expect(compiled).toBe(entry);
    });
  });

  describe('ambiguous base class warning', () => {
    let warn: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warn = vi
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
    });

    afterEach(() => warn.mockRestore());

    it('should warn when two resolvers on different branches share a declaring base', () => {
      class SharedBase {}
      class First extends SharedBase {}
      class Second extends SharedBase {}

      new ResolverImplementationMap(
        [resolverFor(First), resolverFor(Second)],
        [[fieldResolverOn(SharedBase)]],
      );

      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0][0])).toContain('SharedBase');
    });

    it('should stay silent for a chain where every class is a resolver', () => {
      class BaseUserResolver {}
      class UserResolver extends BaseUserResolver {}
      class AdminUserResolver extends UserResolver {}

      new ResolverImplementationMap(
        [
          resolverFor(BaseUserResolver),
          resolverFor(UserResolver),
          resolverFor(AdminUserResolver),
        ],
        [[fieldResolverOn(BaseUserResolver)]],
      );

      expect(warn).not.toHaveBeenCalled();
    });

    it('should stay silent when the shared base declares no handlers', () => {
      class LoggingBase {}
      class First extends LoggingBase {}
      class Second extends LoggingBase {}

      new ResolverImplementationMap(
        [resolverFor(First), resolverFor(Second)],
        [[]],
      );

      expect(warn).not.toHaveBeenCalled();
    });
  });
});
