import * as ts from 'typescript';
import { mergePluginOptions } from './merge-options.js';
import { isFilenameMatched } from './utils/is-filename-matched.util.js';
import { resolvePluginOptionsForFile } from './utils/module-format.util.js';
import { ModelClassVisitor } from './visitors/model-class.visitor.js';

const typeClassVisitor = new ModelClassVisitor();

export const before = (options?: Record<string, any>, program?: ts.Program) => {
  options = mergePluginOptions(options);

  return (ctx: ts.TransformationContext): ts.Transformer<any> => {
    return (sf: ts.SourceFile) => {
      if (isFilenameMatched(options.typeFileNameSuffix, sf.fileName)) {
        const fileOptions = resolvePluginOptionsForFile(
          options,
          sf,
          program.getCompilerOptions(),
        );
        return typeClassVisitor.visit(sf, ctx, program, fileOptions);
      }
      return sf;
    };
  };
};
