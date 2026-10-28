// Stand-in for the Anthropic Messages API during browser E2E tests (no real key in CI).
// Coach requests get a deterministic reply that echoes context; structured-output
// requests (photo analysis, preference parsing) get schema-shaped JSON.
import http from 'node:http';

const port = Number(process.env.FAKE_LLM_PORT ?? 4011);

function reply(model, text) {
  return {
    id: `msg_e2e_${Date.now()}`,
    type: 'message',
    role: 'assistant',
    model,
    content: [{ type: 'text', text }],
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: { input_tokens: 100, output_tokens: 40 },
  };
}

function exampleFor(schema) {
  if (!schema || typeof schema !== 'object') return null;
  if (schema.enum) return schema.enum[0];
  switch (schema.type) {
    case 'object': {
      const out = {};
      for (const [k, v] of Object.entries(schema.properties ?? {})) out[k] = exampleFor(v);
      return out;
    }
    case 'array':
      return schema.items ? [exampleFor(schema.items)] : [];
    case 'string':
      return 'example';
    case 'number':
    case 'integer':
      return 100;
    case 'boolean':
      return false;
    default:
      if (Array.isArray(schema.type)) return exampleFor({ ...schema, type: schema.type.find((t) => t !== 'null') });
      if (schema.anyOf) return exampleFor(schema.anyOf[0]);
      return null;
  }
}

http
  .createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      if (req.method === 'GET') return res.writeHead(200).end('ok');
      const body = JSON.parse(raw || '{}');
      const format = body.output_config?.format;
      let payload;
      if (format?.schema) {
        const sys = typeof body.system === 'string' ? body.system : '';
        const data = sys.includes('FOOD_PHOTO')
          ? { items: [{ name: 'grilled chicken breast', estimatedGrams: 150, matchQuery: 'chicken breast', per100g: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 }, confidence: 'medium' }], notes: ['Estimated from a single photo.'] }
          : exampleFor(format.schema);
        payload = reply(body.model, JSON.stringify(data));
      } else {
        const last = [...(body.messages ?? [])].reverse().find((m) => m.role === 'user');
        const text = typeof last?.content === 'string' ? last.content : 'your question';
        payload = reply(body.model, `E2E coach reply: I received "${text.slice(0, 80)}". Focus on consistent training, progressive overload and adequate protein.`);
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(payload));
    });
  })
  .listen(port, '127.0.0.1', () => console.log(`fake-llm listening on ${port}`));
