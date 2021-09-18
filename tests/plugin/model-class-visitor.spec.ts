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
import { PluginOptions } from '../../lib/plugin/merge-options';

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
    const actual = transpile(createCatDtoText, { introspectComments: true });
    expect(actual).toMatchSnapshot();
  });

  it('should add partial metadata factory when some decorators exist', () => {
    const options: ts.CompilerOptions = {
      ...defaultCompilerOptions,
      removeComments: true,
    };

    const actual = transpile(
      createCatDtoAltText,
      {
        introspectComments: true,
      },
      options,
    );

    expect(actual).toMatchSnapshot();
  });

  it('should manage imports statements when code "downleveled"', () => {
    const options: ts.CompilerOptions = {
      ...defaultCompilerOptions,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES5,
    };

    const actual = transpile(es5CreateCatDtoText, {}, options);
    expect(actual).toMatchSnapshot();
  });

  it('should support & understand nullable type unions', () => {
    const actual = transpile(nullableDtoText, {});
    expect(actual).toMatchSnapshot();
  });

  describe('JsDoc Introspection', () => {
    it('Should parse jsDoc set right before property', () => {
      const source = `
@ObjectType()
export class TestModel {
  /**
  * description
  */
  name: string;
}
      `;
      const actual = transpile(source, { introspectComments: true });

      expect(actual).toMatchInlineSnapshot(`
        "let TestModel = class TestModel {
            static _GRAPHQL_METADATA_FACTORY() {
                return {
                    name: { type: () => String, description: \\"description\\" }
                };
            }
        };
        TestModel = __decorate([
            ObjectType()
        ], TestModel);
        export { TestModel };
        "
      `);
    });

    it('Should parse jsDoc when decorator set on member', async () => {
      const source = `
@ObjectType()
export class TestModel {
  /**
  * description
  */
  @ResolveField(() => Type)
  name: string;
}
`;
      const actual = transpile(source, { introspectComments: true });

      expect(actual).toMatchInlineSnapshot(`
        "let TestModel = class TestModel {
            static _GRAPHQL_METADATA_FACTORY() {
                return {
                    name: { type: () => String, description: \\"description\\" }
                };
            }
        };
        __decorate([
            ResolveField(() => Type)
        ], TestModel.prototype, \\"name\\", void 0);
        TestModel = __decorate([
            ObjectType()
        ], TestModel);
        export { TestModel };
        "
      `);
    });

    it('Should get deprecation reason from @deprecated tag', () => {
      const source = `
@ObjectType()
export class TestModel {
  /**
  * description
  * @deprecated our fancy deprecation message
  */
  @ResolveField(() => Type)
  name: string;
}
`;
      const actual = transpile(source, { introspectComments: true });

      expect(actual).toMatchInlineSnapshot(`
        "let TestModel = class TestModel {
            static _GRAPHQL_METADATA_FACTORY() {
                return {
                    name: { type: () => String, description: \\"description\\", deprecationReason: \\"our fancy deprecation message\\" }
                };
            }
        };
        __decorate([
            ResolveField(() => Type)
        ], TestModel.prototype, \\"name\\", void 0);
        TestModel = __decorate([
            ObjectType()
        ], TestModel);
        export { TestModel };
        "
      `);
    });

    it('Should respect empty @deprecated tag', () => {
      const source = `
@ObjectType()
export class TestModel {
  /**
  * description
  * @deprecated
  */
  @ResolveField(() => Type)
  name: string;
}
`;
      const actual = transpile(source, { introspectComments: true });

      expect(actual).toMatchInlineSnapshot(`
        "let TestModel = class TestModel {
            static _GRAPHQL_METADATA_FACTORY() {
                return {
                    name: { type: () => String, description: \\"description\\", deprecationReason: \\"deprecated\\" }
                };
            }
        };
        __decorate([
            ResolveField(() => Type)
        ], TestModel.prototype, \\"name\\", void 0);
        TestModel = __decorate([
            ObjectType()
        ], TestModel);
        export { TestModel };
        "
      `);
    });

    it('should not parse jsDoc when introspectComments = false', () => {
      const source = `
@ObjectType()
export class TestModel {
  /**
  * description
  * @deprecated
  */
  @ResolveField(() => Type)
  name: string;
}
`;
      const actual = transpile(source, { introspectComments: false });

      expect(actual).toMatchInlineSnapshot(`
        "let TestModel = class TestModel {
            static _GRAPHQL_METADATA_FACTORY() {
                return {
                    name: { type: () => String }
                };
            }
        };
        __decorate([
            ResolveField(() => Type)
        ], TestModel.prototype, \\"name\\", void 0);
        TestModel = __decorate([
            ObjectType()
        ], TestModel);
        export { TestModel };
        "
      `);
    });
  });


  describe('TypeChecker', () => {
    it('Should resolve aliased type', () => {
      const source = `
      
type NumberAlias = number;
type Foo = {bar: 1};

@ObjectType()
export class TestModel {
  // prop: NumberAlias;
  prop2: number[];
  prop2: Foo[];
}
`;
      const actual = transpile(source, { introspectComments: true });

      console.log(actual);
      expect(true).toBeTruthy();
    });

    it('Should resolve optional array enum types in strict mode', () => {
      const source = `
enum Status {
  ENABLED,
  DISABLED
}

@ObjectType()
export class TestModel {
  statusArr?: Status[];
}
`;
      const actual = transpile(source, { introspectComments: true });

      console.log(actual);
      expect(true).toBeTruthy();
    });
  });

  it('Should properly pick parent enum type (not a property) when prop optional in strict mode', () => {
    const source = `
enum Status {
  ENABLED,
  DISABLED
}

@ObjectType()
export class TestModel {
  status2?: Status;
}
`;
    const actual = transpile(source, { introspectComments: true });

    expect(actual).toMatchInlineSnapshot(`
"var Status;
(function (Status) {
    Status[Status[\\"ENABLED\\"] = 0] = \\"ENABLED\\";
    Status[Status[\\"DISABLED\\"] = 1] = \\"DISABLED\\";
})(Status || (Status = {}));
let TestModel = class TestModel {
    static _GRAPHQL_METADATA_FACTORY() {
        return {
            status2: { type: () => Status, nullable: true }
        };
    }
};
TestModel = __decorate([
    ObjectType()
], TestModel);
export { TestModel };
"
`);
  });

  describe('Special virtual types for GraphQL', () => {
    // todo ID / Float / Int
  });


});

// todo:
// repeat test cases for non-type checker implementation
// - separate test-cases for complicated cases:
//   - unions eq 'foo' | 'bar' and string | undefined
//   - promise / observable / Partial

// should throw error when no type checker passed but advancedTypeIntrospection: true
// should work without typeChecker and Program when advancedTypeIntrospection: false
// should skip files with name not matching pattern
