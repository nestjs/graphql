import { mkdtemp, rm, writeFile } from 'fs/promises';
import { join, relative } from 'path';
import { globPaths } from '../../lib/utils/glob.util';

describe('globPaths', () => {
  let directory: string;
  let absoluteDirectory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(process.cwd(), 'tmp-glob-'));
    await writeFile(
      join(directory, 'schema.graphql'),
      'type Query { ok: Boolean }',
    );
    absoluteDirectory = await mkdtemp(join(process.cwd(), 'tmp-abs-glob-'));
    await writeFile(
      join(absoluteDirectory, 'schema.graphql'),
      'type Query { absolute: Boolean }',
    );
  });

  afterEach(async () => {
    await rm(directory, { force: true, recursive: true });
    await rm(absoluteDirectory, { force: true, recursive: true });
  });

  it('preserves absolute matches for absolute patterns', async () => {
    await expect(globPaths(join(directory, '*.graphql'))).resolves.toEqual([
      join(directory, 'schema.graphql'),
    ]);
  });

  it('preserves relative matches for relative patterns', async () => {
    const relativePattern = relative(
      process.cwd(),
      join(directory, '*.graphql'),
    );
    const relativeSchemaPath = relative(
      process.cwd(),
      join(directory, 'schema.graphql'),
    );

    await expect(globPaths(relativePattern)).resolves.toEqual([
      relativeSchemaPath,
    ]);
  });

  it('preserves pattern order when absolute and relative patterns are mixed', async () => {
    const relativePattern = relative(
      process.cwd(),
      join(directory, '*.graphql'),
    );
    const relativeSchemaPath = relative(
      process.cwd(),
      join(directory, 'schema.graphql'),
    );
    const absolutePattern = join(absoluteDirectory, '*.graphql');
    const absoluteSchemaPath = join(absoluteDirectory, 'schema.graphql');

    await expect(
      globPaths([relativePattern, absolutePattern]),
    ).resolves.toEqual([relativeSchemaPath, absoluteSchemaPath]);
  });

  it('applies negative patterns', async () => {
    await writeFile(
      join(directory, 'skip.graphql'),
      'type Query { skip: Boolean }',
    );
    const relativePattern = relative(
      process.cwd(),
      join(directory, '*.graphql'),
    );
    const relativeSchemaPath = relative(
      process.cwd(),
      join(directory, 'schema.graphql'),
    );
    const relativeSkipPath = relative(
      process.cwd(),
      join(directory, 'skip.graphql'),
    );

    await expect(
      globPaths([relativePattern, `!${relativeSkipPath}`]),
    ).resolves.toEqual([relativeSchemaPath]);
  });

  it('deduplicates matches from repeated patterns', async () => {
    const relativePattern = relative(
      process.cwd(),
      join(directory, '*.graphql'),
    );
    const relativeSchemaPath = relative(
      process.cwd(),
      join(directory, 'schema.graphql'),
    );

    await expect(
      globPaths([relativePattern, relativePattern]),
    ).resolves.toEqual([relativeSchemaPath]);
  });

  it('does not expand directory patterns', async () => {
    await expect(globPaths(directory)).resolves.toEqual([]);
  });
});
