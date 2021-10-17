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
import {
  nullableDtoText,
  nullableDtoTextTranspiled,
} from './fixtures/nullable.dto';
import {
  deprecationDtoText,
  deprecationDtoTranspiled,
} from './fixtures/deprecation.dto';
import { PluginOptions } from '../../lib/plugin/merge-options';
import { ObjectType, InputType, InterfaceType } from '../../lib';

const defaultCompilerOptions: ts.CompilerOptions = {
  module: ts.ModuleKind.ES2020,
  target: ts.ScriptTarget.ES2020,
  newLine: ts.NewLineKind.LineFeed,
  noEmitHelpers: true,
  strict: true,
};

function transpile(
  source: string,
  pluginOptions: PluginOptions,
  compilerOptions = defaultCompilerOptions,
): string {
  const filename = 'create-cat.input.ts';
  const fakeProgram = ts.createProgram([filename], compilerOptions);

  const result = ts.transpileModule(source, {
    compilerOptions: compilerOptions,
    fileName: 'test.input.ts',
    transformers: {
      before: [before(pluginOptions, fakeProgram)],
    },
  });

  return result.outputText;
}

describe('API model properties', () => {
  it('should add the metadata factory when no decorators exist', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
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
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
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

  it('should support & understand nullable type unions', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      strict: true,
    };
    const filename = 'nullable.input.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(nullableDtoText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [before({}, fakeProgram)],
      },
    });
    expect(result.outputText).toEqual(nullableDtoTextTranspiled);
  });

  it('should respect @deprecation tag from JsDoc', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      strict: true,
    };
    const filename = 'deprecation.input.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(deprecationDtoText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [before({ introspectComments: true }, fakeProgram)],
      },
    });
    expect(result.outputText).toEqual(deprecationDtoTranspiled);
  });

  it('should process only classes decorated with one of supported decorators', () => {
    const source = `
@${ObjectType.name}()
class ObjectTypeModel {
  prop: string;
}

@${InputType.name}()
class InputTypeModel {
  prop: string;
}

@${InterfaceType.name}()
class InterfaceTypeModel {
  prop: string;
}

class NotAModel {
  prop: string;
}
`;

    const actual = transpile(source, {});
    expect(actual).toMatchInlineSnapshot(`
"\\"use strict\\";
let ObjectTypeModel = class ObjectTypeModel {
    static _GRAPHQL_METADATA_FACTORY() {
        return { prop: { type: () => String } };
    }
};
ObjectTypeModel = __decorate([
    ObjectType()
], ObjectTypeModel);
let InputTypeModel = class InputTypeModel {
    static _GRAPHQL_METADATA_FACTORY() {
        return { prop: { type: () => String } };
    }
};
InputTypeModel = __decorate([
    InputType()
], InputTypeModel);
let InterfaceTypeModel = class InterfaceTypeModel {
    static _GRAPHQL_METADATA_FACTORY() {
        return { prop: { type: () => String } };
    }
};
InterfaceTypeModel = __decorate([
    InterfaceType()
], InterfaceTypeModel);
class NotAModel {
}
"
`);
  });
});
