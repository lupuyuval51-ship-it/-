import http from 'node:http';

export const rawModel = (id, hf, extra = {}) => ({
  id, hugging_face_id: hf, name: `Vendor: ${id.split('/')[1]}`, created: 1700000000, description: 'desc',
  context_length: 131072, architecture: { input_modalities: ['text'], output_modalities: ['text'] },
  pricing: { prompt: '0.0000005', completion: '0.000001' }, supported_parameters: ['tools', 'reasoning'],
  top_provider: { max_completion_tokens: 8192 }, ...extra
});

export const FAKE_CATALOG = [
  rawModel('qwen/qwen3.8-27b', 'Qwen/Qwen3.8-27B'),
  rawModel('deepseek/deepseek-v4-pro', 'deepseek-ai/DeepSeek-V4-Pro'),
  rawModel('moonshotai/kimi-k3', 'moonshotai/Kimi-K3', { created: 1790000000 }),
  rawModel('qwen/qwen3.8-27b:free', 'Qwen/Qwen3.8-27B', { pricing: { prompt: '0', completion: '0' } }),
  rawModel('qwen/qwen3.8-27b:batch', 'Qwen/Qwen3.8-27B'),
  rawModel('anthropic/closed-model', undefined),
  rawModel('x/old', 'x/old', { expiration_date: '2020-01-01' }),
  rawModel('x/image-only', 'x/img', { architecture: { input_modalities: ['text'], output_modalities: ['image'] } })
];

// fetch stand-in: public catalog endpoints are faked, everything else goes to the real network stack
export function fakeFetch({ catalog = FAKE_CATALOG, failCatalog = false } = {}) {
  return async (url, init) => {
    const u = String(url);
    if (u.startsWith('https://openrouter.ai/api/v1/models')) {
      if (failCatalog) return new Response('nope', { status: 503 });
      return Response.json({ data: catalog });
    }
    if (u.startsWith('https://huggingface.co/api/models/')) return Response.json({ cardData: { license: 'apache-2.0' }, safetensors: { total: 27e9 } });
    return fetch(url, init);
  };
}

// Minimal OpenAI-compatible upstream: GET /models, POST /chat/completions (SSE)
export function startMockUpstream({ models = ['qwen/qwen3.8-27b', 'local-only-model'], reply = ['Hel', 'lo'], status = 200 } = {}) {
  const seen = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', () => {
      if (req.url === '/v1/models') return res.end(JSON.stringify({ data: models.map(id => ({ id })) }));
      seen.push({ headers: req.headers, body: body ? JSON.parse(body) : null });
      if (status !== 200) { res.writeHead(status, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: { message: 'upstream says no' } })); }
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write(': keep-alive\n\n');
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { reasoning: 'hmm' } }] })}\n\n`);
      for (const piece of reply) res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: piece } }] })}\n\n`);
      res.write(`data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: 'stop' }], usage: { prompt_tokens: 3, completion_tokens: 2 } })}\n\n`);
      res.end('data: [DONE]\n\n');
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, seen, url: `http://127.0.0.1:${server.address().port}/v1` })));
}

export const listen = server => new Promise(r => server.listen(0, '127.0.0.1', () => r(`http://127.0.0.1:${server.address().port}`)));
export const close = server => new Promise(r => { server.closeAllConnections?.(); server.close(r); });
