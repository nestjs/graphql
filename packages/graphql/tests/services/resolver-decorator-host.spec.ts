import { Logger } from '@nestjs/common';
import { ResolverDecoratorHost } from '../../lib/services/resolver-decorator-host.js';

describe('ResolverDecoratorHost', () => {
  let host: ResolverDecoratorHost;
  let loggerError: ReturnType<typeof vi.spyOn>;
  const unhandled = vi.fn();

  beforeAll(() => {
    process.on('unhandledRejection', unhandled);
  });

  afterAll(() => {
    process.off('unhandledRejection', unhandled);
  });

  beforeEach(() => {
    host = new ResolverDecoratorHost();
    unhandled.mockClear();
    loggerError = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    loggerError.mockRestore();
  });

  const flush = () => new Promise((resolve) => setTimeout(resolve, 10));

  it('should return the promise of an async "request end" hook', async () => {
    host.setOnRequestEndHook(async () => {});

    expect(host.onRequestEnd({})).toBeInstanceOf(Promise);
  });

  it('should not leave the rejection of an async "request end" hook unhandled', async () => {
    host.setOnRequestEndHook(async () => {
      throw new Error('insert failed');
    });

    host.onRequestEnd({ operationName: 'A'.repeat(65) });
    await flush();

    expect(unhandled).not.toHaveBeenCalled();
    expect(loggerError).toHaveBeenCalledWith(
      'The "request end" hook failed.',
      expect.stringContaining('insert failed'),
    );
  });

  it('should not leave the rejection of an async "request start" hook unhandled', async () => {
    host.setOnRequestStartHook(async () => {
      throw new Error('span failed');
    });

    const state = host.onRequestStart({});
    await flush();

    expect(unhandled).not.toHaveBeenCalled();
    await expect(state).rejects.toThrow('span failed');
  });

  it('should return what a synchronous hook returns', () => {
    host.setOnRequestStartHook(() => 'state');

    expect(host.onRequestStart({})).toBe('state');
    expect(host.onRequestEnd({})).toBeUndefined();
  });
});
