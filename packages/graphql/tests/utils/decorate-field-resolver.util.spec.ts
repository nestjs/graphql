import { GraphQLObjectType, GraphQLString } from 'graphql';
import { MiddlewareContext } from '../../lib/interfaces/index.js';
import { decorateFieldResolverWithMiddleware } from '../../lib/utils/decorate-field-resolver.util.js';

describe('decorateFieldResolverWithMiddleware', () => {
  const root = { id: '1' };
  const context = { req: {} };
  const info = { fieldName: 'field' } as any;

  const decorate = () => {
    const seen: MiddlewareContext[] = [];
    const received: unknown[][] = [];
    const resolver = decorateFieldResolverWithMiddleware(
      (...args: unknown[]) =>
        () => {
          received.push(args);
          return 'value';
        },
      [
        (ctx, next) => {
          seen.push(ctx);
          return next();
        },
      ],
    ) as (...args: unknown[]) => Promise<unknown>;
    return { resolver, seen, received };
  };

  it('should hand the arguments of a field resolver as they are', async () => {
    const { resolver, seen, received } = decorate();
    const args = { limit: 1 };

    expect(await resolver(root, args, context, info)).toBe('value');
    expect(seen[0]).toEqual({ source: root, args, context, info });
    expect(received[0]).toEqual([root, args, context, info]);
  });

  it('should lay out the arguments of a reference resolver for the middleware only', async () => {
    const { resolver, seen, received } = decorate();

    // "@apollo/subgraph" calls reference resolvers with "(reference, context, info)"
    expect(await resolver(root, context, info)).toBe('value');
    expect(seen[0]).toEqual({ source: root, args: {}, context, info });
    expect(received[0]).toEqual([root, context, info]);
  });

  it('should lay out the arguments of a "resolveType" callback for the middleware only', async () => {
    const { resolver, seen, received } = decorate();
    const abstractType = new GraphQLObjectType({
      name: 'Abstract',
      fields: { id: { type: GraphQLString } },
    });

    await resolver(root, context, info, abstractType);
    expect(seen[0]).toEqual({ source: root, args: {}, context, info });
    expect(received[0]).toEqual([root, context, info, abstractType]);
  });
});
