import * as ts from 'typescript';
import { PluginOptions, mergePluginOptions } from '../merge-options.js';
import { isFilenameMatched } from '../utils/is-filename-matched.util.js';
import { resolvePluginOptionsForFile } from '../utils/module-format.util.js';
import { ModelClassVisitor } from './model-class.visitor.js';

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
        resolvePluginOptionsForFile(
          parsedOptions,
          sf,
          program.getCompilerOptions(),
        ),
      );
    }
  }

  collect() {
    return {
      models: this.modelClassVisitor.collectedMetadata,
    };
  }
}
