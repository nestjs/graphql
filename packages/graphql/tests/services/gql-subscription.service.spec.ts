import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GqlSubscriptionService,
  GqlSubscriptionServiceOptions,
} from '../../lib/services/gql-subscription.service';

const { mockWsConstructor, mockUseServer, mockSubServerCreate } = vi.hoisted(
  () => ({
    mockWsConstructor: vi.fn(),
    mockUseServer: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    mockSubServerCreate: vi.fn().mockReturnValue({ close: vi.fn() }),
  }),
);

// Mock external dependencies
vi.mock('graphql-ws/use/ws', () => ({
  useServer: mockUseServer,
}));

vi.mock('subscriptions-transport-ws', () => ({
  GRAPHQL_WS: 'graphql-ws',
  SubscriptionServer: {
    create: mockSubServerCreate,
  },
}));

vi.mock('graphql-ws', () => ({
  GRAPHQL_TRANSPORT_WS_PROTOCOL: 'graphql-transport-ws',
}));

vi.mock('ws', () => {
  class MockWebSocketServer {
    options: any;
    handleUpgrade = vi.fn();
    emit = vi.fn();
    on = vi.fn();
    constructor(opts: any) {
      this.options = opts || {};
      mockWsConstructor(opts);
    }
  }
  return { WebSocketServer: MockWebSocketServer };
});

describe('GqlSubscriptionService', () => {
  let mockHttpServer: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpServer = {
      on: vi.fn(),
    };
  });

  describe('constructor', () => {
    it('should create default WebSocketServer instances when no custom server is provided', () => {
      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql',
        'graphql-ws': {},
      };

      new GqlSubscriptionService(options, mockHttpServer);

      expect(mockWsConstructor).toHaveBeenCalledWith({
        path: '/graphql',
        noServer: true,
      });
    });

    it('should use custom server for graphql-ws when provided', () => {
      const customWss = {
        options: { path: '/custom' },
        handleUpgrade: vi.fn(),
        emit: vi.fn(),
        on: vi.fn(),
      } as any;

      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql',
        'graphql-ws': {
          server: customWss,
        },
      };

      const service = new GqlSubscriptionService(options, mockHttpServer);

      expect((service as any).wss).toBe(customWss);
    });

    it('should use custom server for subscriptions-transport-ws when provided', () => {
      const customSubWss = {
        options: { path: '/custom-sub' },
        handleUpgrade: vi.fn(),
        emit: vi.fn(),
        on: vi.fn(),
      } as any;

      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql',
        'subscriptions-transport-ws': {
          server: customSubWss,
        },
      };

      const service = new GqlSubscriptionService(options, mockHttpServer);

      expect((service as any).subTransWs).toBe(customSubWss);
    });

    it('should handle boolean true for graphql-ws (default behavior)', () => {
      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql',
        'graphql-ws': true,
      };

      new GqlSubscriptionService(options, mockHttpServer);

      expect(mockWsConstructor).toHaveBeenCalled();
    });

    it('should handle boolean true for subscriptions-transport-ws', () => {
      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql',
        'subscriptions-transport-ws': true,
      };

      new GqlSubscriptionService(options, mockHttpServer);

      expect(mockWsConstructor).toHaveBeenCalled();
    });

    it('should use custom path from graphql-ws config', () => {
      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql',
        'graphql-ws': {
          path: '/custom-ws-path',
        },
      };

      new GqlSubscriptionService(options, mockHttpServer);

      expect(mockWsConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/custom-ws-path',
          noServer: true,
        }),
      );
    });

    it('should support mixed config — custom server for one, default for the other', () => {
      const customWss = {
        options: { path: '/custom' },
        handleUpgrade: vi.fn(),
        emit: vi.fn(),
        on: vi.fn(),
      } as any;

      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql',
        'graphql-ws': {
          server: customWss,
        },
        'subscriptions-transport-ws': {},
      };

      const service = new GqlSubscriptionService(options, mockHttpServer);

      expect((service as any).wss).toBe(customWss);
      expect((service as any).subTransWs).not.toBe(customWss);
    });
  });

  describe('initialize', () => {
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

    it('should not pass server or path to SubscriptionServer.create options', () => {
      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql',
        'subscriptions-transport-ws': {
          path: '/ws',
          keepAlive: 10000,
        },
      };

      new GqlSubscriptionService(options, mockHttpServer);

      const callArgs = mockSubServerCreate.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('path');
      expect(callArgs).not.toHaveProperty('server');
      expect(callArgs).toHaveProperty('keepAlive', 10000);
    });

    it('should register upgrade handler on httpServer', () => {
      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql',
        'graphql-ws': true,
      };

      new GqlSubscriptionService(options, mockHttpServer);

      expect(mockHttpServer.on).toHaveBeenCalledWith(
        'upgrade',
        expect.any(Function),
      );
    });

    it('should handle upgrade when request url matches path', () => {
      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql',
        'graphql-ws': true,
      };

      const service = new GqlSubscriptionService(options, mockHttpServer);
      const upgradeHandler = mockHttpServer.on.mock.calls.find(
        (call: any[]) => call[0] === 'upgrade',
      )[1];

      const mockReq = {
        url: '/graphql/subscriptions',
        headers: { 'sec-websocket-protocol': 'graphql-transport-ws' },
      };
      const mockSocket = {};
      const mockHead = {};

      upgradeHandler(mockReq, mockSocket, mockHead);

      const wss = (service as any).wss;
      expect(wss.handleUpgrade).toHaveBeenCalledWith(
        mockReq,
        mockSocket,
        mockHead,
        expect.any(Function),
      );
    });

    it('should handle upgrade with custom server instance', () => {
      const customWss = {
        options: {},
        handleUpgrade: vi.fn(),
        emit: vi.fn(),
        on: vi.fn(),
      } as any;

      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql',
        'graphql-ws': {
          server: customWss,
        },
      };

      new GqlSubscriptionService(options, mockHttpServer);
      const upgradeHandler = mockHttpServer.on.mock.calls.find(
        (call: any[]) => call[0] === 'upgrade',
      )[1];

      const mockReq = {
        url: '/graphql',
        headers: { 'sec-websocket-protocol': 'graphql-transport-ws' },
      };
      const mockSocket = {};
      const mockHead = {};

      upgradeHandler(mockReq, mockSocket, mockHead);

      expect(customWss.handleUpgrade).toHaveBeenCalledWith(
        mockReq,
        mockSocket,
        mockHead,
        expect.any(Function),
      );
    });
  });

  describe('stop', () => {
    it('should dispose graphql-ws and close subscription server', async () => {
      const options: GqlSubscriptionServiceOptions = {
        schema: {} as any,
        path: '/graphql',
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      };

      const service = new GqlSubscriptionService(options, mockHttpServer);

      await service.stop();

      expect((service as any).wsGqlDisposable.dispose).toHaveBeenCalled();
      expect((service as any).subServer.close).toHaveBeenCalled();
    });
  });
});
