import { INestApplication } from '@nestjs/common';
import { FileSystemHelper } from '@nestjs/graphql/schema-builder/helpers/file-system.helper.js';
import { Test } from '@nestjs/testing';
import { TransformAutoSchemaFileModule } from '../graphql/transform-auto-schema-file.module.js';
import { sortedPrintedSchemaSnapshot } from '../utils/printed-schema.snapshot.js';

describe('GraphQL with transformAutoSchemaFile', () => {
  let app: INestApplication;

  const writeFileMock = vi.fn().mockImplementation(() => Promise.resolve());
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [TransformAutoSchemaFileModule],
    })
      .overrideProvider(FileSystemHelper)
      .useValue({
        writeFile: writeFileMock,
      })
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  it(`should write transformed auto schema file`, () => {
    expect(writeFileMock).toHaveBeenCalledTimes(1);
    expect(writeFileMock).toHaveBeenCalledWith(
      'schema.graphql',
      sortedPrintedSchemaSnapshot,
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
