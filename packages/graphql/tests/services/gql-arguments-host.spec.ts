import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host.js';
import { GraphQLObjectType } from 'graphql';
import { GqlArgumentsHost } from '../../lib/services/gql-arguments-host.js';

const createHost = (args: any[], type = 'graphql') => {
  const host = new ExecutionContextHost(args);
  host.setType(type);
  return host;
};

describe('GqlArgumentsHost', () => {
  it('should expose the positions of a field resolver call', () => {
    const host = GqlArgumentsHost.create(
      createHost(['root', { id: 1 }, 'ctx', 'info']),
    );
    expect(host.getRoot()).toBe('root');
    expect(host.getArgs()).toEqual({ id: 1 });
    expect(host.getContext()).toBe('ctx');
    expect(host.getInfo()).toBe('info');
  });

  it('should align the positions of a reference resolver call (no "args")', () => {
    const host = GqlArgumentsHost.create(
      createHost([{ __typename: 'User', id: 1 }, 'ctx', 'info']),
    );
    expect(host.getRoot()).toEqual({ __typename: 'User', id: 1 });
    expect(host.getArgs()).toBeUndefined();
    expect(host.getContext()).toBe('ctx');
    expect(host.getInfo()).toBe('info');
  });

  it('should align the positions of a "resolveType" call (no "args")', () => {
    const abstractType = new GraphQLObjectType({ name: 'Node', fields: {} });
    const host = GqlArgumentsHost.create(
      createHost([{ id: 1 }, 'ctx', 'info', abstractType]),
    );
    expect(host.getArgs()).toBeUndefined();
    expect(host.getContext()).toBe('ctx');
    expect(host.getInfo()).toBe('info');
  });

  it('should leave the arguments of other hosts as they are', () => {
    const args = ['req', 'res', 'next'];
    const host = GqlArgumentsHost.create(createHost(args, 'http'));
    expect(host.getArgs()).toBe('res');
  });
});
