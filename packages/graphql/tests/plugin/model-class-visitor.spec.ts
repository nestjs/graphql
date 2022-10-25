import * as fs from 'fs';
import * as ts from 'typescript';
import { InputType, InterfaceType, ObjectType } from '../../lib';
import { before } from '../../lib/plugin/compiler-plugin';
import { PluginOptions } from '../../lib/plugin/merge-options';
import {
  createCatDtoAltText,
  createCatDtoTextAltTranspiled,
} from './fixtures/create-cat-alt.dto';
import {
  createCatDtoText,
  createCatDtoTextTranspiled,
} from './fixtures/create-cat.dto';
import {
  deprecationDtoText,
  deprecationDtoTranspiled,
} from './fixtures/deprecation.dto';
import {
  nullableDtoText,
  nullableDtoTextTranspiled,
} from './fixtures/nullable.dto';

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

function compileFiles(
  rootDir: string,
  file: string,
  pluginOptions: PluginOptions = {},
  compilerOptions = defaultCompilerOptions,
) {
  const caseDir = __dirname + rootDir;

  const options: ts.CompilerOptions = {
    ...compilerOptions,
    rootDir: caseDir,
    outDir: caseDir + '/actual',
  };

  const program = ts.createProgram([caseDir + '/' + file], options);

  program.emit(undefined, undefined, undefined, undefined, {
    before: [before(pluginOptions, program)],
  });

  const jsFile = file.replace(/\.ts$/, '.js');
  const actual = fs.readFileSync(caseDir + '/actual/' + jsFile).toString();
  const expected = fs.readFileSync(caseDir + '/expected/' + jsFile).toString();

  return { actual, expected };
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
    const compilerOptions: ts.CompilerOptions = {
      ...defaultCompilerOptions,
      module: ts.ModuleKind.CommonJS,
    };

    const { actual, expected } = compileFiles(
      '/cases/es5-eager-imports',
      'post.model.ts',
      {},
      compilerOptions,
    );

    expect(actual).toEqual(expected);
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
      "\"use strict\";
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

  it('should process fields declared as getters ', () => {
    const source = `
@ObjectType()
class ObjectTypeModel {
  get prop(): string {}
}
`;

    const actual = transpile(source, {});
    expect(actual).toMatchInlineSnapshot(`
      "\"use strict\";
      let ObjectTypeModel = class ObjectTypeModel {
          get prop() { }
          static _GRAPHQL_METADATA_FACTORY() {
              return { prop: { type: () => String } };
          }
      };
      ObjectTypeModel = __decorate([
          ObjectType()
      ], ObjectTypeModel);
      "
    `);
  });

  describe('should add description from JSDoc to class decorators argument', () => {
    it('when there are no arguments on decorator', () => {
      const source = `
/** Test Description */
@ObjectType()
class ObjectTypeModel {}
`;
      const actual = transpile(source, { introspectComments: true });
      expect(actual).toMatchInlineSnapshot(`
        "\"use strict\";
        /** Test Description */
        let ObjectTypeModel = class ObjectTypeModel {
            static _GRAPHQL_METADATA_FACTORY() {
                return {};
            }
        };
        ObjectTypeModel = __decorate([
            ObjectType({ description: \"Test Description\" })
        ], ObjectTypeModel);
        "
      `);
    });

    it('when there are arguments on decorator', () => {
      const source = `
/** Test1 Description */
@ObjectType({isAbstract: true})
class Test1Model {}

/** Test2 Description */
@ObjectType('name', {isAbstract: true})
class Test2Model {}
`;
      const actual = transpile(source, { introspectComments: true });
      expect(actual).toMatchInlineSnapshot(`
        "\"use strict\";
        /** Test1 Description */
        let Test1Model = class Test1Model {
            static _GRAPHQL_METADATA_FACTORY() {
                return {};
            }
        };
        Test1Model = __decorate([
            ObjectType({ description: \"Test1 Description\", isAbstract: true })
        ], Test1Model);
        /** Test2 Description */
        let Test2Model = class Test2Model {
            static _GRAPHQL_METADATA_FACTORY() {
                return {};
            }
        };
        Test2Model = __decorate([
            ObjectType('name', { description: \"Test2 Description\", isAbstract: true })
        ], Test2Model);
        "
      `);
    });

    it('should work if parameters passed as variable reference or function', () => {
      const source = `
/** test1 description */
@ObjectType('name', getOptions())
class Test1 {}

/** test2 description */
@ObjectType('name', options)
class Test2 {}
`;
      const actual = transpile(source, { introspectComments: true });
      expect(actual).toMatchInlineSnapshot(`
        "\"use strict\";
        /** test1 description */
        let Test1 = class Test1 {
            static _GRAPHQL_METADATA_FACTORY() {
                return {};
            }
        };
        Test1 = __decorate([
            ObjectType('name', { ...{ description: \"test1 description\" }, ...getOptions() })
        ], Test1);
        /** test2 description */
        let Test2 = class Test2 {
            static _GRAPHQL_METADATA_FACTORY() {
                return {};
            }
        };
        Test2 = __decorate([
            ObjectType('name', { ...{ description: \"test2 description\" }, ...options })
        ], Test2);
        "
      `);
    });
  });

  it('should amend Field decorator with introspection data', () => {
    const source = `
import { ID } from '@nestjs/graphql';

const field3Options = {nullable: true};

@ObjectType()
class Model {
   /**
   * Description
   */
   @Field(() => ID)
   field: string;

   /**
   * Description
   */
   @Field(() => ID, {nullable: true})
   field1: string;

   /**
   * Description
   */
   @Field({nullable: false})
   field2?: string;
   
   /**
   * Description
   */
   @Field(field3Options)
   field3: string;
   
   name: string;
}
`;

    const actual = transpile(source, { introspectComments: true });
    expect(actual).toMatchInlineSnapshot(`
      "import { ID } from '@nestjs/graphql';
      const field3Options = { nullable: true };
      let Model = class Model {
          static _GRAPHQL_METADATA_FACTORY() {
              return { name: { type: () => String } };
          }
      };
      __decorate([
          Field(() => ID, { description: \"Description\" })
      ], Model.prototype, \"field\", void 0);
      __decorate([
          Field(() => ID, { description: \"Description\", nullable: true })
      ], Model.prototype, \"field1\", void 0);
      __decorate([
          Field(() => String, { nullable: false, description: \"Description\" })
      ], Model.prototype, \"field2\", void 0);
      __decorate([
          Field(() => String, { ...{ description: \"Description\" }, ...field3Options })
      ], Model.prototype, \"field3\", void 0);
      Model = __decorate([
          ObjectType()
      ], Model);
      "
    `);
  });
});
