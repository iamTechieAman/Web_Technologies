declare module 'ws' {
  export class WebSocket {
    static OPEN: number;
    readyState: number;
    send(data: string): void;
    on(event: 'message', listener: (message: string | Buffer) => void): void;
    on(event: 'close', listener: () => void): void;
  }

  export class WebSocketServer {
    constructor(options: { port?: number; server?: unknown });
    on(event: 'connection', listener: (ws: WebSocket) => void): void;
    on(event: 'error', listener: (error: Error) => void): void;
  }
}
