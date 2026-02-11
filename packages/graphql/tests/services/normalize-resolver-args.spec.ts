import { normalizeResolverArgs } from '../../lib/utils/normalize-resolver-args';

describe('normalizeResolverArgs', () => {
  describe('standard resolver arguments (4 args)', () => {
    it('should return the same array reference for 4-argument resolvers', () => {
      const args = ['root', { id: 1 }, { user: {} }, { fieldName: 'test' }];
      const result = normalizeResolverArgs(args);
      expect(result).toBe(args);
    });

    it('should not modify the original array', () => {
      const args = ['root', { id: 1 }, { user: {} }, { fieldName: 'test' }];
      normalizeResolverArgs(args);
      expect(args).toEqual([
        'root',
        { id: 1 },
        { user: {} },
        { fieldName: 'test' },
      ]);
    });
  });

  describe('reference resolver arguments (3 args)', () => {
    it('should insert undefined at position 1 for 3-argument resolvers', () => {
      const args = ['root', { user: {} }, { fieldName: 'test' }];
      const result = normalizeResolverArgs(args);
      expect(result).not.toBe(args);
      expect(result).toEqual([
        'root',
        undefined,
        { user: {} },
        { fieldName: 'test' },
        undefined,
      ]);
    });

    it('should not modify the original 3-arg array', () => {
      const args = ['root', { user: {} }, { fieldName: 'test' }];
      const originalArgs = [...args];
      normalizeResolverArgs(args);
      expect(args).toEqual(originalArgs);
    });
  });

  describe('edge cases', () => {
    it('should handle empty arrays', () => {
      const args: any[] = [];
      const result = normalizeResolverArgs(args);
      expect(result).toBe(args);
    });

    it('should handle single element arrays', () => {
      const args = ['root'];
      const result = normalizeResolverArgs(args);
      expect(result).toBe(args);
    });

    it('should handle 5+ argument arrays', () => {
      const args = ['a', 'b', 'c', 'd', 'e'];
      const result = normalizeResolverArgs(args);
      expect(result).toBe(args);
    });
  });
});
