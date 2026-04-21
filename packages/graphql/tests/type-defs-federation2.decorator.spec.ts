import { TypeDefsFederation2Decorator } from '../lib/federation/type-defs-federation2.decorator';

describe('TypeDefsFederation2Decorator', () => {
  let decorator: TypeDefsFederation2Decorator;

  beforeEach(() => {
    decorator = new TypeDefsFederation2Decorator();
  });

  describe('decorate', () => {
    it('should default to federation v2.12 import url', () => {
      const result = decorator.decorate('type Query { hello: String }');
      expect(result).toContain(
        'url: "https://specs.apollo.dev/federation/v2.12"',
      );
    });

    it('should include the v2.12 default directives', () => {
      const result = decorator.decorate('type Query { hello: String }');
      const expectedDirectives = [
        '@authenticated',
        '@cacheTag',
        '@composeDirective',
        '@context',
        '@cost',
        '@extends',
        '@external',
        '@fromContext',
        '@inaccessible',
        '@interfaceObject',
        '@key',
        '@listSize',
        '@override',
        '@policy',
        '@provides',
        '@requires',
        '@requiresScopes',
        '@shareable',
        '@tag',
      ];
      for (const directive of expectedDirectives) {
        expect(result).toContain(`"${directive}"`);
      }
    });

    it('should append the original typeDefs after the @link extension', () => {
      const typeDefs = 'type Query { hello: String }';
      const result = decorator.decorate(typeDefs);
      expect(result).toContain(typeDefs);
      const linkIndex = result.indexOf('@link');
      const typeDefsIndex = result.indexOf(typeDefs);
      expect(linkIndex).toBeLessThan(typeDefsIndex);
    });

    it('should respect a user-provided importUrl override', () => {
      const result = decorator.decorate('type Query { hello: String }', {
        version: 2,
        importUrl: 'https://specs.apollo.dev/federation/v2.3',
      });
      expect(result).toContain(
        'url: "https://specs.apollo.dev/federation/v2.3"',
      );
    });

    it('should respect a user-provided directives override', () => {
      const result = decorator.decorate('type Query { hello: String }', {
        version: 2,
        directives: ['@key', '@shareable'],
      });
      expect(result).toContain('"@key"');
      expect(result).toContain('"@shareable"');
      expect(result).not.toContain('"@policy"');
      expect(result).not.toContain('"@cacheTag"');
    });

    it('should prepend @ to directives missing the prefix', () => {
      const result = decorator.decorate('type Query { hello: String }', {
        version: 2,
        directives: ['key'],
      });
      expect(result).toContain('"@key"');
    });
  });
});
