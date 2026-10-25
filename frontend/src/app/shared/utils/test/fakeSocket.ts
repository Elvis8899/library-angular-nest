import { Socket } from "socket.io-client";

type Handler = (...args: never[]) => void;

/**
 * Stands in for the Socket.IO client: `serverSends` plays an event from the
 * server, and `connect` succeeds unless `refuseNext` queued a refusal.
 */
export class FakeSocket {
  auth: Socket["auth"] = {};
  connected = false;
  private readonly _handlers = new Map<string, Handler[]>();
  private readonly _refusals: string[] = [];

  readonly connect = vi.fn(() => {
    const refusal = this._refusals.shift();
    if (refusal !== undefined) {
      this.serverSends("connect_error", new Error(refusal));
      return;
    }
    this.connected = true;
    this.serverSends("connect");
  });
  readonly disconnect = vi.fn(() => {
    this.connected = false;
  });

  on(event: string, handler: Handler) {
    this._handlers.set(event, [...(this._handlers.get(event) ?? []), handler]);
    return this;
  }

  /** The next connects fail, one with each connect_error message. */
  refuseNext(...messages: string[]) {
    this._refusals.push(...messages);
  }

  /** The token the handshake would send now. */
  token(): unknown {
    let sent: unknown;
    if (typeof this.auth === "function") {
      this.auth((data) => (sent = data));
    }
    return (sent as { token?: unknown } | undefined)?.token;
  }

  serverSends(event: string, ...args: unknown[]) {
    for (const handler of this._handlers.get(event) ?? []) {
      (handler as (...a: unknown[]) => void)(...args);
    }
  }
}
