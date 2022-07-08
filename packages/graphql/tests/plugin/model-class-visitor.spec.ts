import * as ts from 'typescript';
import * as fs from 'fs';
import { ModuleKind } from 'typescript';
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

  it('should process fields declared as getters ', () => {
    const source = `
@ObjectType()
class ObjectTypeModel {
  get prop(): string {}
}
`;

    const actual = transpile(source, {});
    expect(actual).toMatchInlineSnapshot(`
"\\"use strict\\";
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

  describe('Should add description from JSDoc to decorators argument', () => {
    it('when there are no arguments on decorator', () => {
      const source = `
/** Test Description */
@ObjectType()
class ObjectTypeModel {}
`;
      const actual = transpile(source, { introspectComments: true });
      expect(actual).toMatchInlineSnapshot(`
"\\"use strict\\";
/** Test Description */
let ObjectTypeModel = class ObjectTypeModel {
    static _GRAPHQL_METADATA_FACTORY() {
        return {};
    }
};
ObjectTypeModel = __decorate([
    ObjectType({ description: \\"Test Description\\" })
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
"\\"use strict\\";
/** Test1 Description */
let Test1Model = class Test1Model {
    static _GRAPHQL_METADATA_FACTORY() {
        return {};
    }
};
Test1Model = __decorate([
    ObjectType({ description: \\"Test1 Description\\", isAbstract: true })
], Test1Model);
/** Test2 Description */
let Test2Model = class Test2Model {
    static _GRAPHQL_METADATA_FACTORY() {
        return {};
    }
};
Test2Model = __decorate([
    ObjectType('name', { description: \\"Test2 Description\\", isAbstract: true })
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
"\\"use strict\\";
/** test1 description */
let Test1 = class Test1 {
    static _GRAPHQL_METADATA_FACTORY() {
        return {};
    }
};
Test1 = __decorate([
    ObjectType('name', { ...{ description: \\"test1 description\\" }, ...getOptions() })
], Test1);
/** test2 description */
let Test2 = class Test2 {
    static _GRAPHQL_METADATA_FACTORY() {
        return {};
    }
};
Test2 = __decorate([
    ObjectType('name', { ...{ description: \\"test2 description\\" }, ...options })
], Test2);
"
`);
    });
  });

  it('Should recognize inline string unions and register them using registerEnumType()', () => {
    const source = `
@ObjectType()
class ObjectTypeModel {
  test: 'aaa' | 'bbb' | 'ccc'; 
  withNull: 'foo' | 'bar' | 'baz' | null; 
  withSpace: 'with space' | 'bar'; 
  test3: string; 
}
`;

    const actual = transpile(source, {});
    expect(actual).toMatchInlineSnapshot(`
"\\"use strict\\";
import { registerEnumType } from \\"@nestjs/graphql\\";
registerEnumType({ aaa: \\"aaa\\", bbb: \\"bbb\\", ccc: \\"ccc\\" }, { name: \\"ObjectTypeModelTestEnum\\" });
registerEnumType({ foo: \\"foo\\", bar: \\"bar\\", baz: \\"baz\\" }, { name: \\"ObjectTypeModelWithNullEnum\\" });
registerEnumType({ with_space: \\"with space\\", bar: \\"bar\\" }, { name: \\"ObjectTypeModelWithSpaceEnum\\" });
let ObjectTypeModel = class ObjectTypeModel {
    static _GRAPHQL_METADATA_FACTORY() {
        return { test: { type: () => ObjectTypeModelTestEnum }, withNull: { nullable: true, type: () => ObjectTypeModelWithNullEnum }, withSpace: { type: () => ObjectTypeModelWithSpaceEnum }, test3: { type: () => String } };
    }
};
ObjectTypeModel = __decorate([
    ObjectType()
], ObjectTypeModel);
"
`);
  });

  it('Should add enum name if it not specified in registerEnumType call', () => {
    const source = `
import {registerEnumType} from '@nestjs/graphql';

registerEnumType(Type);
registerEnumType(Type, {description: 'description'});
registerEnumType(Type, {name: 'AnotherName'});
`;

    const actual = transpile(source, {});
    expect(actual).toMatchInlineSnapshot(`
"import { registerEnumType } from '@nestjs/graphql';
registerEnumType(Type, { name: \\"Type\\" });
registerEnumType(Type, { name: \\"Type\\", description: 'description' });
registerEnumType(Type, { name: 'AnotherName' });
"
`);
  });

  it('Should infer name for union type from variable name', () => {
    const source = `
import {createUnionType} from '@nestjs/graphql';

const MyAwesomeUnion = createUnionType({types: [Foo, Bar, Baz]});
const MyAwesomeUnion = createUnionType({types: [Foo, Bar, Baz], name: 'JustUnion'});
`;

    const actual = transpile(source, {});
    expect(actual).toMatchInlineSnapshot(`
"import { createUnionType } from '@nestjs/graphql';
const MyAwesomeUnion = createUnionType({ name: \\"MyAwesomeUnion\\", types: [Foo, Bar, Baz] });
const MyAwesomeUnion = createUnionType({ name: 'JustUnion', types: [Foo, Bar, Baz] });
"
`);
  });

  describe('Enum Discovering', () => {
    it('Should ignore union with @private ang @HideEnum tag', () => {
      const source = `
/**
* @private
*/
enum Status {
    ENABLED,
    DISABLED
}

/**
* @HideEnum
*/
enum Status2 {
    ENABLED,
    DISABLED
}
`;

      const actual = transpile(source, { autoRegisterEnums: true });
      expect(actual).toMatchInlineSnapshot(`
"\\"use strict\\";
/**
* @private
*/
var Status;
(function (Status) {
    Status[Status[\\"ENABLED\\"] = 0] = \\"ENABLED\\";
    Status[Status[\\"DISABLED\\"] = 1] = \\"DISABLED\\";
})(Status || (Status = {}));
/**
* @HideEnum
*/
var Status2;
(function (Status2) {
    Status2[Status2[\\"ENABLED\\"] = 0] = \\"ENABLED\\";
    Status2[Status2[\\"DISABLED\\"] = 1] = \\"DISABLED\\";
})(Status2 || (Status2 = {}));
"
`);
    });

    it('Should introspect comments for enums', () => {
      const source = `
/**
* Description for Enum
*/
enum Status {
    /**
    * @deprecated this one is deprecated
    */
    ENABLED,
    /**
    * This is a enum field!
    */
    DISABLED
}
`;

      const actual = transpile(source, {
        autoRegisterEnums: true,
        introspectComments: true,
      });
      expect(actual).toMatchInlineSnapshot(`
"\\"use strict\\";
import { registerEnumType } from \\"@nestjs/graphql\\";
/**
* Description for Enum
*/
var Status;
(function (Status) {
    /**
    * @deprecated this one is deprecated
    */
    Status[Status[\\"ENABLED\\"] = 0] = \\"ENABLED\\";
    /**
    * This is a enum field!
    */
    Status[Status[\\"DISABLED\\"] = 1] = \\"DISABLED\\";
})(Status || (Status = {}));
registerEnumType(Status, { name: \\"Status\\", description: \\"Description for Enum\\", valuesMap: { ENABLED: { deprecationReason: \\"this one is deprecated\\" }, DISABLED: { description: \\"This is a enum field!\\" } } });
"
`);
    });

    it('Should not add additional import if there is one in ES Modules', () => {
      const source = `
import { registerEnumType, otherPackage } from '@nestjs/graphql';

enum Status {
    ENABLED,
    DISABLED
}

/**
* @private
*/
enum Status2 {
    ENABLED,
    DISABLED
}

otherPackage();
registerEnumType(Status2, {name: 'Status2'});
`;

      const actual = transpile(
        source,
        { autoRegisterEnums: true },
        { module: ModuleKind.ES2015 },
      );
      expect(actual).toMatchInlineSnapshot(`
"import { registerEnumType, otherPackage } from '@nestjs/graphql';
var Status;
(function (Status) {
    Status[Status[\\"ENABLED\\"] = 0] = \\"ENABLED\\";
    Status[Status[\\"DISABLED\\"] = 1] = \\"DISABLED\\";
})(Status || (Status = {}));
registerEnumType(Status, { name: \\"Status\\", valuesMap: {} });
/**
* @private
*/
var Status2;
(function (Status2) {
    Status2[Status2[\\"ENABLED\\"] = 0] = \\"ENABLED\\";
    Status2[Status2[\\"DISABLED\\"] = 1] = \\"DISABLED\\";
})(Status2 || (Status2 = {}));
otherPackage();
registerEnumType(Status2, { name: 'Status2' });
"
`);
    });

    it('Should create eager namespaced import and call registerEnumType from this import in CommonJs', () => {
      const source = `
import { registerEnumType, otherPackage } from '@nestjs/graphql';

enum Status {
    ENABLED,
    DISABLED
}

/**
* @private
*/
enum Status2 {
    ENABLED,
    DISABLED
}

otherPackage();
registerEnumType(Status2, {name: 'Status2'});
`;

      const actual = transpile(
        source,
        { autoRegisterEnums: true },
        { module: ModuleKind.CommonJS },
      );
      expect(actual).toMatchInlineSnapshot(`
"\\"use strict\\";
Object.defineProperty(exports, \\"__esModule\\", { value: true });
var nestjs_graphql_1 = require(\\"@nestjs/graphql\\");
var graphql_1 = require(\\"@nestjs/graphql\\");
var Status;
(function (Status) {
    Status[Status[\\"ENABLED\\"] = 0] = \\"ENABLED\\";
    Status[Status[\\"DISABLED\\"] = 1] = \\"DISABLED\\";
})(Status || (Status = {}));
nestjs_graphql_1.registerEnumType(Status, { name: \\"Status\\", valuesMap: {} });
/**
* @private
*/
var Status2;
(function (Status2) {
    Status2[Status2[\\"ENABLED\\"] = 0] = \\"ENABLED\\";
    Status2[Status2[\\"DISABLED\\"] = 1] = \\"DISABLED\\";
})(Status2 || (Status2 = {}));
(0, graphql_1.otherPackage)();
(0, graphql_1.registerEnumType)(Status2, { name: 'Status2' });
"
`);
    });
  });

  it('Should use type defined in explicit decorator instead of introspection', () => {
    const source = `
import { ID } from '@nestjs/graphql';

@ObjectType()
class Model {
   /**
   * Description
   */
   @Field(() => ID)
   field: string;

   name: string;
}
`;

    const actual = transpile(source, {});
    expect(actual).toMatchInlineSnapshot(`
"import { ID } from '@nestjs/graphql';
let Model = class Model {
    static _GRAPHQL_METADATA_FACTORY() {
        return { field: { type: () => ID }, name: { type: () => String } };
    }
};
__decorate([
    Field(() => ID)
], Model.prototype, \\"field\\", void 0);
Model = __decorate([
    ObjectType()
], Model);
"
`);
  });
});
