import { GraphQLResolveInfo } from 'graphql';
import { MiddlewareContext, NextFn } from '../../lib/interfaces';

export const testMiddleware = async (ctx: MiddlewareContext, next: NextFn) => {
  let logData: MiddlewareContext = {
    source: ctx.source,
    args: ctx.args,
    context: ctx.context,
  };

  if (ctx.info) {
    logData = {
      ...logData,
      info: ctx.info,
    };
  }

  return next();
};

describe('testMiddleware', () => {
  let mockContext: MiddlewareContext;
  let mockNext: NextFn;

  beforeEach(() => {
    mockContext = {
      source: {},
      args: {},
      context: {},
      info: {
        path: { typename: 'TestType', key: 'testField' },
      } as GraphQLResolveInfo,
    };

    mockNext = jest.fn().mockResolvedValue('next result');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call next when info is provided', () => {
    testMiddleware(mockContext, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle case when info is undefined', () => {
    mockContext.info = undefined;
    testMiddleware(mockContext, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle case when info is null', () => {
    mockContext.info = null;
    testMiddleware(mockContext, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});
