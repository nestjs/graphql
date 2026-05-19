import { readFileSync } from 'fs';
import { join } from 'path';
import * as ts from 'typescript';
import { ReadonlyVisitor } from '../../lib/plugin/visitors/readonly.visitor.js';
import { PluginMetadataPrinter } from './helpers/metadata-printer.js';

function createTsProgram(tsconfigPath: string) {
  const parsedCmd = ts.getParsedCommandLineOfConfigFile(
    tsconfigPath,
    undefined,
    ts.sys as unknown as ts.ParseConfigFileHost,
  );
  const { options, fileNames: rootNames, projectReferences } = parsedCmd!;
  const program = ts.createProgram({ options, rootNames, projectReferences });
  return program;
}

describe('Readonly visitor', () => {
  const visitor = new ReadonlyVisitor({
    pathToSource: join(import.meta.dirname, 'fixtures', 'project'),
    introspectComments: true,
    debug: true,
  });
  const metadataPrinter = new PluginMetadataPrinter();

  it('should generate a serialized metadata', () => {
    const tsconfigPath = join(
      import.meta.dirname,
      'fixtures',
      'project',
      'tsconfig.json',
    );
    const program = createTsProgram(tsconfigPath);

    for (const sourceFile of program.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile) {
        visitor.visit(program, sourceFile);
      }
    }

    const result = metadataPrinter.print(
      {
        [visitor.key]: visitor.collect(),
      },
      visitor.typeImports,
    );

    const expectedOutput = readFileSync(
      join(import.meta.dirname, 'fixtures', 'serialized-meta.fixture.ts'),
      'utf-8',
    );

    expect(result).toEqual(expectedOutput);
  });
});
