import * as ts from 'typescript';
import { before } from '../../lib/plugin/compiler-plugin.js';

const compilerOptions: ts.CompilerOptions = {
  module: ts.ModuleKind.ES2020,
  target: ts.ScriptTarget.ES2020,
  newLine: ts.NewLineKind.LineFeed,
  noEmitHelpers: true,
  experimentalDecorators: true,
  strict: true,
};

function transpile(source: string): string {
  const filename = 'user.model.ts';
  const fakeProgram = ts.createProgram([filename], compilerOptions);

  return ts.transpileModule(source, {
    compilerOptions,
    fileName: filename,
    transformers: {
      before: [before({}, fakeProgram)],
    },
  }).outputText;
}

function getMetadataFactory(output: string): string {
  const [, factory] = output.match(
    /static _GRAPHQL_METADATA_FACTORY\(\) {\s*return (.*);\s*}/,
  );
  return factory;
}

describe('CLI plugin members that are not fields', () => {
  it('should skip protected and #private members like private ones', () => {
    const output = transpile(`
import { ObjectType } from '@nestjs/graphql';

@ObjectType()
export class User {
  id: number;
  private failedLogins = 0;
  protected passwordHash: string;
  protected get hashAlgorithm(): string { return 'argon2'; }
  #sessionToken: string;
  static instances: number;
}
`);
    expect(getMetadataFactory(output)).toEqual(
      '{ id: { type: () => Number } }',
    );
  });

  it('should skip members hidden with an aliased "HideField()"', () => {
    const output = transpile(`
import { HideField, HideField as Hide, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class User {
  id: number;
  @HideField() resetToken: string;
  @Hide() totpSecret: string;
}
`);
    expect(getMetadataFactory(output)).toEqual(
      '{ id: { type: () => Number } }',
    );
  });

  it('should skip members hidden with an aliased re-export of "HideField()"', () => {
    const output = transpile(`
import { ObjectType } from '@nestjs/graphql';
import { HideField as Hidden } from './decorators';

@ObjectType()
export class User {
  id: number;
  @Hidden() totpSecret: string;
  @Hidden totpBackupCodes: string[];
}
`);
    expect(getMetadataFactory(output)).toEqual(
      '{ id: { type: () => Number } }',
    );
  });
});
