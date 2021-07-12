import { execute, subscribe } from 'graphql';
import { makeServer, ServerOptions } from 'graphql-ws';
import { IncomingMessage } from 'http';
import * as ws from 'ws';
import { GraphQLWsException } from './graphql-ws.exception';

export type WebSocket = typeof ws.prototype;

export interface GraphQLWsSubscriptionServiceOptions {
  schema: ServerOptions['schema'];
  onConnect?: ServerOptions['onConnect'];
  onDisconnect?: ServerOptions['onDisconnect'];
  context?: ServerOptions['context'];
  keepAlive?: number;
}

export interface Extra {
  readonly socket: WebSocket;
  readonly request: IncomingMessage;
}

export class GraphQLWsSubscriptionService {
  private readonly wss: ws.Server;

  constructor(
    private readonly options: GraphQLWsSubscriptionServiceOptions,
    server: any,
  ) {
    this.wss = new ws.Server({
      server,
      path: '/graphql',
    });
    this.initialize();
  }

  private initialize() {
    const server = makeServer<Extra>({
      schema: this.options.schema,
      execute,
      subscribe,
      context: this.options.context,
      onConnect: this.options.onConnect,
      onDisconnect: this.options.onDisconnect,
    });

    const ws = this.wss;

    ws.on('error', (err) => {
      // catch the first thrown error and re-throw it once all clients have been notified
      let firstErr: Error | null = err;

      // report server errors by erroring out all clients with the same error
      for (const client of ws.clients) {
        try {
          client.close(1011, 'Internal Error');
        } catch (err) {
          firstErr = firstErr ?? err;
        }
      }

      if (firstErr) {
        throw firstErr;
      }
    });

    const keepAlive = this.options.keepAlive;

    ws.on('connection', (socket, request) => {
      // keep alive through ping-pong messages
      let pongWait: NodeJS.Timeout | null = null;
      const pingInterval =
        keepAlive > 0 && isFinite(keepAlive)
          ? setInterval(() => {
              // ping pong on open sockets only
              if (socket.readyState === socket.OPEN) {
                // terminate the connection after pong wait has passed because the client is idle
                pongWait = setTimeout(() => {
                  socket.terminate();
                }, keepAlive);

                // listen for client's pong and stop socket termination
                socket.once('pong', () => {
                  if (pongWait) {
                    clearTimeout(pongWait);
                    pongWait = null;
                  }
                });

                socket.ping();
              }
            }, keepAlive)
          : null;

      const closed = server.opened(
        {
          protocol: socket.protocol,
          send: (data) =>
            new Promise((resolve, reject) => {
              socket.send(data, (err) => (err ? reject(err) : resolve()));
            }),
          close: (code, reason) => socket.close(code, reason),
          onMessage: (cb) =>
            socket.on('message', async (event) => {
              try {
                await cb(event.toString());
              } catch (err) {
                if (err instanceof GraphQLWsException) {
                  socket.close(err.code, err.reason);
                } else {
                  socket.close(1011, 'Internal error');
                }
              }
            }),
        },
        { socket, request },
      );

      socket.once('close', (code, reason) => {
        if (pongWait) clearTimeout(pongWait);
        if (pingInterval) clearInterval(pingInterval);
        closed(code, reason);
      });
    });
  }

  async stop() {
    for (const client of this.wss.clients) {
      client.close(1001, 'Going away');
    }
    this.wss.removeAllListeners();
    await new Promise<void>((resolve, reject) => {
      this.wss.close((err) => (err ? reject(err) : resolve()));
    });
  }
}
