/**
 * JSON-RPC 2.0 server over stdio (or a named pipe).
 * The desktop UI connects to this process and sends JSON-RPC requests.
 * Response events are streamed back as newline-delimited JSON.
 *
 * Security: the process is started by the desktop shell; it is NOT exposed on
 * any TCP port by default. If a TCP mode is ever added, it must bind to
 * 127.0.0.1 with a random per-launch token header.
 */

import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { createInterface } from 'node:readline';

/**
 * Minimal JSON-RPC 2.0 dispatcher.
 * Handlers are async (request) => result | throws an {code, message} error.
 */
export class JsonRpcServer {
  constructor() {
    this.handlers = new Map();
    this.pending = new Map(); // id -> { resolve, reject } for outbound requests
    this.nextId = 1;
    this._send = null; // injected by listen()
  }

  /** Register a method handler. */
  on(method, fn) { this.handlers.set(method, fn); return this; }

  /**
   * Send an outbound request FROM the server TO the client (e.g. approval.request).
   * Returns a promise that resolves when the client replies with approval.respond.
   */
  request(method, params) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this._send?.({ jsonrpc: '2.0', id, method, params });
    });
  }

  /** Emit a notification (no id; client does not reply). */
  notify(method, params) {
    this._send?.({ jsonrpc: '2.0', method, params });
  }

  /**
   * Wire to a readable input stream and a writable output stream.
   * Reads newline-delimited JSON messages; writes newline-delimited JSON responses.
   */
  listen(input, output) {
    const write = (obj) => output.write(JSON.stringify(obj) + '\n');
    this._send = write;

    const rl = createInterface({ input, terminal: false });
    rl.on('line', async (line) => {
      let msg;
      try { msg = JSON.parse(line); } catch { return write({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); }

      // Handle responses from client (for outbound approval.request etc.)
      if (msg.result !== undefined || msg.error !== undefined) {
        const p = this.pending.get(msg.id);
        if (p) {
          this.pending.delete(msg.id);
          if (msg.error) p.reject(Object.assign(new Error(msg.error.message), { rpcCode: msg.error.code }));
          else p.resolve(msg.result);
        }
        return;
      }

      const { id, method, params } = msg;
      const handler = this.handlers.get(method);
      if (!handler) {
        if (id !== undefined) write({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
        return;
      }
      try {
        const result = await handler(params ?? {});
        if (id !== undefined) write({ jsonrpc: '2.0', id, result: result ?? null });
      } catch (e) {
        if (id !== undefined) write({ jsonrpc: '2.0', id, error: { code: e.rpcCode ?? -32000, message: e.message } });
      }
    });

    rl.on('close', () => process.exit(0));
  }
}
