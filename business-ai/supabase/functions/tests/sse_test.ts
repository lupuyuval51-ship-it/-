import { assertEquals, assertStringIncludes } from '@std/assert';
import { encodeSseEvent, parseSse, SSE_KEEPALIVE, SseWriter } from '../_shared/sse.ts';

Deno.test('sse: events are encoded as event + single JSON data line', () => {
  const text = encodeSseEvent({ event: 'delta', data: { text: 'שלום\nworld "quoted"' } });
  assertEquals(text, 'event: delta\ndata: {"text":"שלום\\nworld \\"quoted\\""}\n\n');
  assertEquals(parseSse(text), [{ event: 'delta', data: { text: 'שלום\nworld "quoted"' } }]);
});

Deno.test('sse: parser ignores keep-alive comments and keeps order', () => {
  const body = [
    encodeSseEvent({ event: 'meta', data: { conversationId: 'c', userMessageId: 'u' } }),
    SSE_KEEPALIVE,
    encodeSseEvent({ event: 'delta', data: { text: 'a' } }),
    encodeSseEvent({ event: 'actions', data: { actions: [], followUps: [] } }),
    encodeSseEvent({ event: 'done', data: { assistantMessageId: 'm' } }),
  ].join('');
  assertEquals(parseSse(body).map((e) => e.event), ['meta', 'delta', 'actions', 'done']);
});

Deno.test('sse: writer stops writing after close or cancel', async () => {
  let writer: SseWriter | null = null;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      writer = new SseWriter(controller);
    },
  });
  const w = writer as unknown as SseWriter;
  w.send({ event: 'error', data: { code: 'internal', message: 'x' } });
  w.close();
  w.send({ event: 'delta', data: { text: 'ignored' } });
  const text = await new Response(stream).text();
  assertStringIncludes(text, 'event: error');
  assertEquals(text.includes('ignored'), false);
});
