import * as ts from 'typescript';
import { mergePluginOptions } from './merge-options';
import { ModelClassVisitor } from './visitors/model-class.visitor';

const typeClassVisitor = new ModelClassVisitor();
const isFilenameMatched = (patterns: string[], filename: string) =>
  patterns.some((path) => filename.includes(path));

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
