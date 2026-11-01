import type { AiProvider } from '../../../server/src/core/types.ts';

/** Device Mode AI: forwards to a user-configured proxy that holds the real keys. Absent proxy => deterministic rules coach. */
export class ProxyAiProvider implements AiProvider {
  readonly name = 'proxy';
  constructor(private readonly url: string, private readonly f: typeof fetch) {}
  private async post(path: string, body: unknown): Promise<string> {
    const r = await this.f(`${this.url.replace(/\/$/, '')}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`proxy_${r.status}`);
    return ((await r.json()) as { text?: string }).text ?? '';
  }
  complete(i: Parameters<AiProvider['complete']>[0]): Promise<string> { return this.post('/ai/complete', i); }
  describeImage(i: { system: string; prompt: string; jpegBase64: string }): Promise<string> { return this.post('/ai/describe-image', i); }
}
