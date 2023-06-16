import * as ts from 'typescript';
import { PluginOptions, mergePluginOptions } from '../merge-options';
import { isFilenameMatched } from '../utils/is-filename-matched.util';
import { ModelClassVisitor } from './model-class.visitor';

export class ReadonlyVisitor {
  public readonly key = '@nestjs/graphql';
  private readonly modelClassVisitor = new ModelClassVisitor();

  get typeImports() {
    return this.modelClassVisitor.typeImports;
  }

  constructor(private readonly options: PluginOptions) {
    options.readonly = true;

    if (!options.pathToSource) {
      throw new Error(`"pathToSource" must be defined in plugin options`);
    }
  }

  visit(program: ts.Program, sf: ts.SourceFile) {
    const factoryHost = { factory: ts.factory } as any;
    const parsedOptions: Record<string, any> = mergePluginOptions(this.options);

    if (isFilenameMatched(parsedOptions.typeFileNameSuffix, sf.fileName)) {
      return this.modelClassVisitor.visit(
        sf,
        factoryHost,
        program,
        parsedOptions,
      );
    }
  }

  collect() {
    return {
      models: this.modelClassVisitor.collectedMetadata,
    };
  }
}
