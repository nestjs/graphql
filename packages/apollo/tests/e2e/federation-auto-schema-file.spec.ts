import { INestApplication } from '@nestjs/common';
import { FileSystemHelper } from '@nestjs/graphql/schema-builder/helpers/file-system.helper';
import { Test } from '@nestjs/testing';
import { FederationAutoSchemaFileModule } from '../code-first-federation/federation-auto-schema-file.module';

describe('Federation - autoSchemaFile generation (issue #3722)', () => {
  let app: INestApplication;

  const writeFileMock = vi.fn().mockImplementation(() => Promise.resolve());

  beforeEach(async () => {
    writeFileMock.mockClear();

    const module = await Test.createTestingModule({
      imports: [FederationAutoSchemaFileModule],
    })
      .overrideProvider(FileSystemHelper)
      .useValue({ writeFile: writeFileMock })
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should write the federated SDL file once with the configured filename', () => {
    expect(writeFileMock).toHaveBeenCalledTimes(1);
    expect(writeFileMock.mock.calls[0][0]).toBe('federation-schema.graphql');
  });

  it('should preserve federation directives (@key, @external, @extends) in the generated SDL', () => {
    const fileContent: string = writeFileMock.mock.calls[0][1];

    // Object types decorated with @Directive('@key(...)') must keep the directive
    // when emitted via autoSchemaFile. Before the fix, graphql's printSchema stripped
    // these federation directives entirely.
    expect(fileContent).toMatch(/type\s+Post[^{]*@key\(fields:\s*"id"\)/);
    expect(fileContent).toMatch(/type\s+User[^{]*@key\(fields:\s*"id"\)/);
    expect(fileContent).toMatch(/type\s+User[^{]*@extends/);
    expect(fileContent).toMatch(/@external/);
  });

  afterEach(async () => {
    await app.close();
  });
});
