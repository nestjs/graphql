import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { printSchema, GraphQLSchema } from 'graphql';
import { FileSystemHelper } from '../../lib/schema-builder/helpers/file-system.helper';
import { sortedPrintedSchemaSnapshot } from '../utils/printed-schema.snapshot';
import { GRAPHQL_SDL_FILE_HEADER } from '../../lib/graphql.constants';
import { GraphQLSchemaHost } from '../../lib';
import { SortAutoSchemaModule } from '../graphql/sort-auto-schema.module';

describe('GraphQL sort autoSchemaFile schema', () => {
  let app: INestApplication;
  let schema: GraphQLSchema;
  let writeFileMock: jest.Mock;

  beforeEach(async () => {
    writeFileMock = jest.fn().mockImplementation(() => Promise.resolve());
    const module = await Test.createTestingModule({
      imports: [SortAutoSchemaModule],
    })
      .overrideProvider(FileSystemHelper)
      .useValue({
        writeFile: writeFileMock,
      })
      .compile();

    app = module.createNestApplication();
    await app.init();

    const graphQLSchemaHost = app.get<GraphQLSchemaHost>(GraphQLSchemaHost);
    schema = graphQLSchemaHost.schema;
  });

  it('should match schema snapshot', () => {
    expect(GRAPHQL_SDL_FILE_HEADER + printSchema(schema)).toEqual(
      sortedPrintedSchemaSnapshot,
    );

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
