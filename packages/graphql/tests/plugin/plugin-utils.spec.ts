import { replaceImportPath } from '../../lib/plugin/utils/plugin-utils';

describe('plugin-utils', () => {
  describe('replaceImportPath', () => {
    it('should replace path to relative', () => {
      const actual = replaceImportPath(
        'import("/root/project/src/author.model").Author',
        '/root/project/src/post.model.ts',
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
      );

      expect(actual).toStrictEqual({
        typeReference: 'require("dependency").Author',
        importPath: 'dependency',
      });
    });
  });
});
