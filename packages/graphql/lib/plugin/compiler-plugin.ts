import * as ts from 'typescript';
import { mergePluginOptions } from './merge-options';
import { isFilenameMatched } from './utils/is-filename-matched.util';
import { ModelClassVisitor } from './visitors/model-class.visitor';

const typeClassVisitor = new ModelClassVisitor();

export const before = (options?: Record<string, any>, program?: ts.Program) => {
  options = mergePluginOptions(options);

  return (ctx: ts.TransformationContext): ts.Transformer<any> => {
    return (sf: ts.SourceFile) => {
      if (isFilenameMatched(options.typeFileNameSuffix, sf.fileName)) {
        return typeClassVisitor.visit(sf, ctx, program, options);
      }
      return sf;
    };
  };
};
