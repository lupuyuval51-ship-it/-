/**
 * `node:http` for device mode. Only server/src/index.ts (the network entry point, not used on the
 * device) needs it, and only for a type. In device mode requests reach the app through
 * `dispatch()` in ./express.ts instead of a socket.
 */
export function createServer(): never {
  throw new Error('There is no HTTP server in device mode: requests are dispatched in-process');
}

const http = { createServer };
export default http;
