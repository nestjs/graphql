import chokidar from 'chokidar';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { GraphQLDefinitionsFactory } from '../lib/graphql-definitions.factory';

const watchMock = vi.hoisted(() =>
  vi.fn(() => ({
    on: vi.fn(),
  })),
);

vi.mock('chokidar', () => ({
  default: {
    watch: watchMock,
  },
}));

describe('GraphQLDefinitionsFactory', () => {
  let directory: string;

  beforeEach(async () => {
    watchMock.mockClear();
    directory = await mkdtemp(join(tmpdir(), 'nestjs-graphql-definitions-'));
  });

  afterEach(async () => {
    await rm(directory, { force: true, recursive: true });
  });

  it('watches files resolved from type path glob patterns', async () => {
    await writeFile(
      join(directory, 'schema.graphql'),
      'type Query { ok: Boolean }',
    );

    const factory = new GraphQLDefinitionsFactory();
    await factory.generate({
      typePaths: [join(directory, '*.graphql')],
      path: join(directory, 'graphql.ts'),
      outputAs: 'class',
      watch: true,
      debug: false,
    });

    expect(chokidar.watch).toHaveBeenCalledWith([
      join(directory, 'schema.graphql'),
    ]);
  });
});
