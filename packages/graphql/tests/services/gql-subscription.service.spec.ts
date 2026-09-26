import { EventEmitter } from 'events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketServer } from 'ws';
import {
  GqlSubscriptionService,
  GqlSubscriptionServiceOptions,
} from '../../lib/services/gql-subscription.service';

const createMockSocket = () => {
  const socket = new EventEmitter() as any;
  socket.write = vi.fn();
  socket.end = vi.fn();
  socket.destroy = vi.fn();
  socket.setTimeout = vi.fn();
  socket.setNoDelay = vi.fn();
  socket.setKeepAlive = vi.fn();
  socket.readable = true;
  socket.writable = true;
  socket.remoteAddress = '127.0.0.1';
  return socket;
};

const { mockUseServer } = vi.hoisted(() => ({
  mockUseServer: vi.fn().mockReturnValue({ dispose: vi.fn() }),
}));

// Only mock useServer from graphql-ws; use the real WebSocketServer from 'ws'
vi.mock('graphql-ws/use/ws', () => ({
  useServer: mockUseServer,
}));

vi.mock('graphql-ws', () => ({
  GRAPHQL_TRANSPORT_WS_PROTOCOL: 'graphql-transport-ws',
}));

describe('GqlSubscriptionService', () => {
  let mockHttpServer: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpServer = {
      on: vi.fn(),
    };
  });

  describe('constructor', () => {
    it('should create default WebSocketServer instance when no custom server is provided', () => {
      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql',
        'graphql-ws': {},
      };

      const service = new GqlSubscriptionService(options, mockHttpServer);
      const wss: WebSocketServer = (service as any).wss;

      expect(wss).toBeInstanceOf(WebSocketServer);
      expect(wss.options.path).toBe('/graphql');
      expect(wss.options.noServer).toBe(true);
    });

    it('should use custom WebSocketServer instance when provided', () => {
      const customWss = new WebSocketServer({
        noServer: true,
        path: '/subscriptions',
      });

      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql',
        'graphql-ws': {
          server: customWss,
        },
      };

      const service = new GqlSubscriptionService(options, mockHttpServer);

      expect((service as any).wss).toBe(customWss);
      expect((service as any).wss.options.path).toBe('/subscriptions');
    });

    it('should throw an error if custom server is not instantiated with noServer: true', () => {
      const invalidWss = {
        options: {
          noServer: false,
          path: '/custom',
        },
      } as any;

      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql',
        'graphql-ws': {
          server: invalidWss,
        },
      };

      expect(() => new GqlSubscriptionService(options, mockHttpServer)).toThrow(
        'Custom WebSocketServer passed to "graphql-ws" must be instantiated with "noServer: true".',
      );
    });

    it('should handle boolean true for graphql-ws (default behavior)', () => {
      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql',
        'graphql-ws': true,
      };

      const service = new GqlSubscriptionService(options, mockHttpServer);
      const wss: WebSocketServer = (service as any).wss;

      expect(wss).toBeInstanceOf(WebSocketServer);
      expect(wss.options.path).toBe('/graphql');
      expect(wss.options.noServer).toBe(true);
    });
  });

  describe('initialize & upgrade handling', () => {
    it('should not pass server or path to useServer options', () => {
      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql',
        'graphql-ws': {
          path: '/ws',
          connectionInitWaitTimeout: 5000,
        },
      };

      new GqlSubscriptionService(options, mockHttpServer);

      const callArgs = mockUseServer.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('path');
      expect(callArgs).not.toHaveProperty('server');
      expect(callArgs).toHaveProperty('connectionInitWaitTimeout', 5000);
    });

    it('should prioritize custom server path over driver default path', () => {
      const customWss = new WebSocketServer({
        noServer: true,
        path: '/subscriptions',
      });

      const handleUpgradeSpy = vi.spyOn(customWss, 'handleUpgrade');

      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql', // Driver default
        'graphql-ws': {
          server: customWss, // Custom server with path: '/subscriptions'
        },
      };

      new GqlSubscriptionService(options, mockHttpServer);
      const upgradeHandler = mockHttpServer.on.mock.calls.find(
        (call: any[]) => call[0] === 'upgrade',
      )[1];

      // 1. Request to custom server path '/subscriptions' should be handled
      const mockReqValid = {
        url: '/subscriptions',
        headers: {
          'sec-websocket-protocol': 'graphql-transport-ws',
          'sec-websocket-key': 'dGhlIHNhbXBsZSBub25jZQ==',
          'sec-websocket-version': '13',
          upgrade: 'websocket',
          connection: 'Upgrade',
        },
        method: 'GET',
      };
      const mockSocket = createMockSocket();
      const mockHead = Buffer.alloc(0);

      upgradeHandler(mockReqValid, mockSocket, mockHead);
      expect(handleUpgradeSpy).toHaveBeenCalledWith(
        mockReqValid,
        mockSocket,
        mockHead,
        expect.any(Function),
      );

      handleUpgradeSpy.mockClear();

      // 2. Request to driver path '/graphql' should NOT be handled because custom server's path is '/subscriptions'
      const mockReqInvalid = {
        url: '/graphql',
        headers: {
          'sec-websocket-protocol': 'graphql-transport-ws',
          'sec-websocket-key': 'dGhlIHNhbXBsZSBub25jZQ==',
          'sec-websocket-version': '13',
          upgrade: 'websocket',
          connection: 'Upgrade',
        },
        method: 'GET',
      };

      upgradeHandler(mockReqInvalid, createMockSocket(), mockHead);
      expect(handleUpgradeSpy).not.toHaveBeenCalled();
    });

    it('should use explicit graphql-ws path when custom server has no internal path', () => {
      const customWss = new WebSocketServer({
        noServer: true,
      });

      const handleUpgradeSpy = vi.spyOn(customWss, 'handleUpgrade');

      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql',
        'graphql-ws': {
          server: customWss,
          path: '/explicit-path',
        },
      };

      new GqlSubscriptionService(options, mockHttpServer);
      const upgradeHandler = mockHttpServer.on.mock.calls.find(
        (call: any[]) => call[0] === 'upgrade',
      )[1];

      const mockReq = {
        url: '/explicit-path',
        headers: {
          'sec-websocket-protocol': 'graphql-transport-ws',
          'sec-websocket-key': 'dGhlIHNhbXBsZSBub25jZQ==',
          'sec-websocket-version': '13',
          upgrade: 'websocket',
          connection: 'Upgrade',
        },
        method: 'GET',
      };
      const mockSocket = createMockSocket();
      const mockHead = Buffer.alloc(0);

      upgradeHandler(mockReq, mockSocket, mockHead);
      expect(handleUpgradeSpy).toHaveBeenCalledWith(
        mockReq,
        mockSocket,
        mockHead,
        expect.any(Function),
      );
    });

    it('should fail closed and not handle upgrade if no path resolves', () => {
      const customWss = new WebSocketServer({
        noServer: true,
        // No path configured on custom wss
      });

      const handleUpgradeSpy = vi.spyOn(customWss, 'handleUpgrade');

      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: undefined, // No path on driver
        'graphql-ws': {
          server: customWss,
        },
      };

      new GqlSubscriptionService(options, mockHttpServer);
      const upgradeHandler = mockHttpServer.on.mock.calls.find(
        (call: any[]) => call[0] === 'upgrade',
      )[1];

      const mockReq = {
        url: '/any-random-url',
        headers: { 'sec-websocket-protocol': 'graphql-transport-ws' },
      };

      upgradeHandler(mockReq, {}, {});
      // Should fail closed: not handle random requests
      expect(handleUpgradeSpy).not.toHaveBeenCalled();
    });

    it('should not handle upgrade if protocol does not match graphql-transport-ws', () => {
      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql',
        'graphql-ws': true,
      };

      const service = new GqlSubscriptionService(options, mockHttpServer);
      const handleUpgradeSpy = vi.spyOn(
        (service as any).wss,
        'handleUpgrade',
      );

      const upgradeHandler = mockHttpServer.on.mock.calls.find(
        (call: any[]) => call[0] === 'upgrade',
      )[1];

      const mockReq = {
        url: '/graphql',
        headers: { 'sec-websocket-protocol': 'other-protocol' },
      };

      upgradeHandler(mockReq, createMockSocket(), Buffer.alloc(0));
      expect(handleUpgradeSpy).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should dispose graphql-ws', async () => {
      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql',
        'graphql-ws': true,
      };

      const service = new GqlSubscriptionService(options, mockHttpServer);

      await service.stop();

      expect((service as any).wsGqlDisposable.dispose).toHaveBeenCalled();
    });
  });
});
