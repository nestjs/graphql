import { replaceImportPath } from '../../lib/plugin/utils/plugin-utils.js';

describe('plugin-utils', () => {
  describe('replaceImportPath', () => {
    describe('when "readonly" is false', () => {
      it('should replace path to relative', () => {
        const actual = replaceImportPath(
          'import("/root/project/src/author.model").Author',
          '/root/project/src/post.model.ts',
          { readonly: false },
        );

        expect(actual).toStrictEqual({
          typeReference: 'require("./author.model").Author',
          importPath: './author.model',
        });
      });

      it('should shorten path if it points to node_modules', () => {
        const actual = replaceImportPath(
          'import("/root/project/src/node_modules/dependency/author.model").Author',
          '/root/project/src/post.model.ts',
          { readonly: false },
        );

        expect(actual).toStrictEqual({
          typeReference: 'require("dependency/author.model").Author',
          importPath: 'dependency/author.model',
        });
      });

      it('should shorten path if it points to node_modules/@types', () => {
        const actual = replaceImportPath(
          'import("/root/project/src/node_modules/@types/dependency/author.model").Author',
          '/root/project/src/post.model.ts',
          { readonly: false },
        );

        expect(actual).toStrictEqual({
          typeReference: 'require("dependency/author.model").Author',
          importPath: 'dependency/author.model',
        });
      });

      it('should shorten path if it points to dependency index file', () => {
        const actual = replaceImportPath(
          'import("/root/project/src/node_modules/dependency/index").Author',
          '/root/project/src/post.model.ts',
          { readonly: false },
        );

        expect(actual).toStrictEqual({
          typeReference: 'require("dependency").Author',
          importPath: 'dependency',
        });
      });
    });

    describe('when "esmCompatible" is true', () => {
      it('should strip import attributes and append the output extension', () => {
        const actual = replaceImportPath(
          'import("/root/project/src/author.model", { with: { "resolution-mode": "import" } }).Author',
          '/root/project/src/post.model.ts',
          { readonly: false, esmCompatible: true },
        );

        expect(actual).toStrictEqual({
          typeReference: '(await import("./author.model.js")).Author',
          importPath: './author.model.js',
          typeName: 'Author',
        });
      });

      it('should use the ".mjs" extension for ".mts" files', () => {
        const actual = replaceImportPath(
          'import("/root/project/src/author.model").Author',
          '/root/project/src/post.model.mts',
          { readonly: false, esmCompatible: true },
        );

        expect(actual.importPath).toEqual('./author.model.mjs');
      });

      it('should not append an extension to a bare specifier', () => {
        const actual = replaceImportPath(
          'import("/root/project/src/node_modules/dependency/author.model").Author',
          '/root/project/src/post.model.ts',
          { readonly: false, esmCompatible: true },
        );

        expect(actual).toStrictEqual({
          typeReference: '(await import("dependency/author.model")).Author',
          importPath: 'dependency/author.model',
          typeName: 'Author',
        });
      });

      it('should append the output extension in "readonly" mode', () => {
        const actual = replaceImportPath(
          'import("/root/project/src/author.model", { with: { "resolution-mode": "import" } }).Author',
          '/root/project/src/post.model.ts',
          {
            readonly: true,
            esmCompatible: true,
            pathToSource: '/root/project/src',
          },
        );

        expect(actual).toStrictEqual({
          typeReference: 'await import("./author.model.js")',
          importPath: './author.model.js',
          typeName: 'Author',
        });
      });
    });

    describe('when "readonly" is true', () => {
      it('should replace path to relative', () => {
        const actual = replaceImportPath(
          'import("/root/project/src/author.model").Author',
          '/root/project/src/post.model.ts',
          { readonly: true, pathToSource: '/root/project/src' },
        );

        expect(actual).toStrictEqual({
          typeReference: 'await import("./author.model")',
          importPath: './author.model',
          typeName: 'Author',
        });
      });

      it('should shorten path if it points to node_modules', () => {
        const actual = replaceImportPath(
          'import("/root/project/src/node_modules/dependency/author.model").Author',
          '/root/project/src/post.model.ts',
          { readonly: true, pathToSource: '/root/project/src' },
        );

        expect(actual).toStrictEqual({
          typeReference: 'await import("dependency/author.model")',
          importPath: 'dependency/author.model',
          typeName: 'Author',
        });
      });

      it('should shorten path if it points to node_modules/@types', () => {
        const actual = replaceImportPath(
          'import("/root/project/src/node_modules/@types/dependency/author.model").Author',
          '/root/project/src/post.model.ts',
          { readonly: true, pathToSource: '/root/project/src' },
        );

        expect(actual).toStrictEqual({
          typeReference: 'await import("dependency/author.model")',
          importPath: 'dependency/author.model',
          typeName: 'Author',
        });
      });

      it('should shorten path if it points to dependency index file', () => {
        const actual = replaceImportPath(
          'import("/root/project/src/node_modules/dependency/index").Author',
          '/root/project/src/post.model.ts',
          { readonly: true, pathToSource: '/root/project/src' },
        );

        expect(actual).toStrictEqual({
          typeReference: 'await import("dependency")',
          importPath: 'dependency',
          typeName: 'Author',
        });
      });
    });
  });
});
