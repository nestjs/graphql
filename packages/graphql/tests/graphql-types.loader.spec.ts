import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { GraphQLTypesLoader } from '../lib/graphql-types.loader';

describe('GraphQLTypesLoader', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'nestjs-graphql-types-'));
  });

  afterEach(async () => {
    await rm(directory, { force: true, recursive: true });
  });

  it('loads type definitions from glob patterns', async () => {
    await writeFile(
      join(directory, 'cat.graphql'),
      'type Cat { id: ID!, name: String! }',
    );
    await writeFile(
      join(directory, 'query.graphql'),
      'type Query { cat: Cat }',
    );

    const loader = new GraphQLTypesLoader();
    const typeDefs = await loader.mergeTypesByPaths(
      join(directory, '*.graphql'),
    );

    expect(typeDefs).toContain('type Query');
    expect(typeDefs).toContain('type Cat');
  });
});
