import { INestApplication } from '@nestjs/common';
import { TransformAutoSchemaFileModule } from '../graphql/transform-auto-schema-file.module';
import { Test } from '@nestjs/testing';
import { FileSystemHelper } from '../../lib/schema-builder/helpers/file-system.helper';
import { sortedPrintedSchemaSnapshot } from '../utils/printed-schema.snapshot';

describe('GraphQL with transformAutoSchemaFile', () => {
  let app: INestApplication;

  const writeFileMock = jest.fn().mockImplementation(() => Promise.resolve());
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
