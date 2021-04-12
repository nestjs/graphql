import * as ts from 'typescript';
import { before } from '../../lib/plugin/compiler-plugin';
import {
  createCatDtoAltText,
  createCatDtoTextAltTranspiled,
} from './fixtures/create-cat-alt.dto';
import {
  createCatDtoText,
  createCatDtoTextTranspiled,
} from './fixtures/create-cat.dto';
import {
  es5CreateCatDtoText,
  es5CreateCatDtoTextTranspiled,
} from './fixtures/es5-class.dto';

describe('API model properties', () => {
  it('should add the metadata factory when no decorators exist', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      strict: true,
    };
    const filename = 'create-cat.input.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(createCatDtoText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [before({}, fakeProgram)],
      },
    });
    expect(result.outputText).toEqual(createCatDtoTextTranspiled);
  });

  it('should add partial metadata factory when some decorators exist', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      strict: true,
      removeComments: true,
    };
    const filename = 'create-cat.input.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(createCatDtoAltText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [
          before(
            {
              introspectComments: true,
            },
            fakeProgram,
          ),
        ],
      },
    });
    expect(result.outputText).toEqual(createCatDtoTextAltTranspiled);
  });

  it('should manage imports statements when code "downleveled"', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES5,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      strict: true,
    };
    const filename = 'es5-class.input.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(es5CreateCatDtoText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [before({}, fakeProgram)],
      },
    });
    expect(result.outputText).toEqual(es5CreateCatDtoTextTranspiled);
  });
});
