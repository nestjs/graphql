import { LocalCompose } from '@apollo/gateway';
import { INestApplication } from '@nestjs/common';
import { FileSystemHelper } from '@nestjs/graphql/schema-builder/helpers/file-system.helper.js';
import { Test } from '@nestjs/testing';
import {
  DirectiveNode,
  DocumentNode,
  Kind,
  parse,
  SchemaExtensionNode,
  specifiedDirectives,
  visit,
} from 'graphql';
import { Federation2AutoSchemaFileModule } from '../code-first-federation/federation2-auto-schema-file.module.js';

const FEDERATION_SPEC_URL_PREFIX = 'https://specs.apollo.dev/federation/v2';

function getFederationLink(document: DocumentNode): DirectiveNode | undefined {
  return document.definitions
    .filter(
      (definition): definition is SchemaExtensionNode =>
        definition.kind === Kind.SCHEMA_EXTENSION,
    )
    .flatMap((definition) => definition.directives ?? [])
    .find((directive) => {
      const url = directive.arguments?.find((arg) => arg.name.value === 'url');
      return (
        directive.name.value === 'link' &&
        url?.value.kind === Kind.STRING &&
        url.value.value.startsWith(FEDERATION_SPEC_URL_PREFIX)
      );
    });
}

function getImportedDirectives(link: DirectiveNode): string[] {
  const importArg = link.arguments?.find((arg) => arg.name.value === 'import');
  if (importArg?.value.kind !== Kind.LIST) {
    return [];
  }
  return importArg.value.values.flatMap((value) =>
    value.kind === Kind.STRING ? [value.value] : [],
  );
}

function getUsedDirectives(document: DocumentNode): string[] {
  const builtInDirectives = new Set([
    'link',
    ...specifiedDirectives.map((directive) => directive.name),
  ]);
  const used = new Set<string>();
  visit(document, {
    Directive(node) {
      if (!builtInDirectives.has(node.name.value)) {
        used.add(`@${node.name.value}`);
      }
    },
  });
  return [...used];
}

describe('Federation 2 - autoSchemaFile generation', () => {
  let app: INestApplication;

  const writeFileMock = vi.fn().mockImplementation(() => Promise.resolve());

  beforeEach(async () => {
    writeFileMock.mockClear();

    const module = await Test.createTestingModule({
      imports: [Federation2AutoSchemaFileModule],
    })
      .overrideProvider(FileSystemHelper)
      .useValue({ writeFile: writeFileMock })
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should link the federation 2 spec in the generated SDL file', () => {
    expect(writeFileMock).toHaveBeenCalledTimes(1);
    expect(writeFileMock.mock.calls[0][0]).toBe('federation2-schema.graphql');

    const fileContent: string = writeFileMock.mock.calls[0][1];
    expect(fileContent).toMatch(
      /extend schema @link\(url: "https:\/\/specs\.apollo\.dev\/federation\/v2\.\d+", import: \[[^\]]+\]\)/,
    );

    const document = parse(fileContent);
    const link = getFederationLink(document);
    expect(link).toBeDefined();

    const usedDirectives = getUsedDirectives(document);
    expect(usedDirectives).toEqual(
      expect.arrayContaining(['@key', '@extends', '@external']),
    );
    expect(getImportedDirectives(link!)).toEqual(
      expect.arrayContaining(usedDirectives),
    );
  });

  it('should write an SDL file that composes with other federation 2 subgraphs', async () => {
    const fileContent: string = writeFileMock.mock.calls[0][1];
    const usersSubgraph = parse(`
      extend schema
        @link(url: "https://specs.apollo.dev/federation/v2.3", import: ["@key"])

      type User @key(fields: "id") {
        id: ID!
        name: String!
      }

      type Query {
        me: User
      }
    `);

    const { supergraphSdl } = await new LocalCompose({
      localServiceList: [
        { name: 'posts', url: 'http://posts', typeDefs: parse(fileContent) },
        { name: 'users', url: 'http://users', typeDefs: usersSubgraph },
      ],
    }).initialize({} as Parameters<LocalCompose['initialize']>[0]);

    expect(supergraphSdl).toContain('type Post');
    expect(supergraphSdl).toContain('type User');
  });

  afterEach(async () => {
    await app.close();
  });
});
