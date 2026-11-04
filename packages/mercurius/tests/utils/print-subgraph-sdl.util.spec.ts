import { parse } from 'graphql';
import { printSubgraphSdl } from '../../lib/utils/print-subgraph-sdl.util.js';

describe('printSubgraphSdl', () => {
  it('should omit a schema definition that only uses the default root type names', () => {
    const sdl = printSubgraphSdl(
      parse(`
        schema { query: Query }
        type Query { id: ID }
      `),
    );
    expect(sdl).not.toContain('schema');
  });

  it('should keep a schema definition with custom root type names', () => {
    const sdl = printSubgraphSdl(
      parse(`
        schema { query: RootQuery }
        type RootQuery { id: ID }
      `),
    );
    expect(sdl).toContain('schema {');
  });

  it('should keep a schema definition that carries directives', () => {
    const sdl = printSubgraphSdl(
      parse(`
        schema @link(url: "https://specs.apollo.dev/federation/v2.5", import: ["@key"]) { query: Query }
        type Query { id: ID }
      `),
    );
    expect(sdl).toContain(
      'schema @link(url: "https://specs.apollo.dev/federation/v2.5", import: ["@key"]) {',
    );
  });
});
