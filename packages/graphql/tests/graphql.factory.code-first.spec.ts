import { Test } from '@nestjs/testing';
import { graphql, GraphQLSchema } from 'graphql';
import { vi } from 'vitest';
import {
  Field,
  FieldMiddleware,
  GraphQLAstExplorer,
  GraphQLFactory,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  ObjectType,
  Query,
  ResolveField,
  Resolver,
  TypeMetadataStorage,
} from '../lib/index.js';
import { GraphQLSchemaBuilder } from '../lib/graphql-schema.builder.js';
import { ResolversExplorerService } from '../lib/services/resolvers-explorer.service.js';
import { ScalarsExplorerService } from '../lib/services/scalars-explorer.service.js';
import { decorateFieldResolverWithMiddleware } from '../lib/utils/decorate-field-resolver.util.js';

const wrap =
  (name: string): FieldMiddleware =>
  async (_ctx, next) =>
    `${name}(${await next()})`;

const globalMiddleware = wrap('global');
const modelMiddleware = wrap('model');
const handlerMiddleware = wrap('handler');

@ObjectType()
class Item {
  @Field({ middleware: [modelMiddleware] })
  overridden: string;
}

@Resolver(() => Item)
class ItemResolver {
  @Query(() => Item)
  item() {
    return {};
  }

  @ResolveField()
  overridden() {
    return 'value';
  }
}

/**
 * Creates a field resolver the way "ResolversExplorerService" decorates
 * a handler with the global middleware and the handler's own middleware.
 */
function createFieldResolver(
  middleware: FieldMiddleware[],
  composition: boolean,
) {
  const resolve = () => 'value';
  const callback = decorateFieldResolverWithMiddleware(
    () => () => resolve(),
    [globalMiddleware, ...middleware],
  );
  if (composition) {
    Reflect.defineMetadata(
      'graphql:field_resolver_composition',
      { resolve, middleware },
      callback,
    );
  }
  return callback;
}

describe('GraphQLFactory (code first)', () => {
  let graphqlFactory: GraphQLFactory;
  let resolverExplorer: { explore: ReturnType<typeof vi.fn> };

  beforeAll(async () => {
    const schemaBuilderModule = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();
    const schemaFactory = schemaBuilderModule.get(GraphQLSchemaFactory);

    resolverExplorer = { explore: vi.fn() };
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: ResolversExplorerService,
          useValue: {
            explore: resolverExplorer.explore,
            getAllCtors: () => [ItemResolver],
          },
        },
        {
          provide: ScalarsExplorerService,
          useValue: { explore: () => [] },
        },
        {
          provide: GraphQLAstExplorer,
          useValue: vi.fn(),
        },
        {
          provide: GraphQLSchemaBuilder,
          useValue: {
            build: (_: unknown, options: any, resolvers: Function[]) =>
              schemaFactory.create(resolvers, options.buildSchemaOptions),
          },
        },
        GraphQLFactory,
      ],
    }).compile();

    graphqlFactory = module.get(GraphQLFactory);
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  async function queryOverridden(overridden: Function) {
    resolverExplorer.explore.mockReturnValueOnce({
      Query: { item: () => ({}) },
      Item: { overridden },
    });
    const schema: GraphQLSchema = await graphqlFactory.generateSchema({
      autoSchemaFile: true,
      buildSchemaOptions: { fieldMiddleware: [globalMiddleware] },
    });
    const { data, errors } = await graphql({
      schema,
      source: '{ item { overridden } }',
    });
    expect(errors).toBeUndefined();
    return (data.item as Item).overridden;
  }

  it('should run the global middleware, then the model field middleware, then the handler middleware', async () => {
    await expect(
      queryOverridden(createFieldResolver([handlerMiddleware], true)),
    ).resolves.toBe('global(model(handler(value)))');
  });

  it('should not run the model field middleware twice when the handler repeats it', async () => {
    await expect(
      queryOverridden(
        createFieldResolver([modelMiddleware, handlerMiddleware], true),
      ),
    ).resolves.toBe('global(model(handler(value)))');
  });

  it('should wrap a field resolver that exposes no composition with the model field middleware', async () => {
    await expect(
      queryOverridden(createFieldResolver([handlerMiddleware], false)),
    ).resolves.toBe('model(global(handler(value)))');
  });
});
