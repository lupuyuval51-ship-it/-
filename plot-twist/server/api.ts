import type { IncomingMessage, ServerResponse } from 'node:http';

/** Temporary stub — replaced by the real AI Director API. */
export function createApiHandler() {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (req.url?.startsWith('/api/status')) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ provider: 'anthropic', state: 'not_configured', configured: false }));
      return;
    }
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found' }));
  };
}
