/**
 * Server-sent events encoding for the advisor stream (AdvisorEvent in domain/ai-api.ts).
 */
import type { AdvisorEvent } from './domain/ai-api.ts';

const encoder = new TextEncoder();

/** `event: <name>\ndata: <json>\n\n`. JSON never contains raw newlines, so one data line suffices. */
export function encodeSseEvent(ev: AdvisorEvent): string {
  return `event: ${ev.event}\ndata: ${JSON.stringify(ev.data)}\n\n`;
}

/** SSE comment line used as a keep-alive while the model is thinking. */
export const SSE_KEEPALIVE = ': keep-alive\n\n';

export const SSE_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  'X-Accel-Buffering': 'no',
});

/** Minimal writer over a ReadableStream controller that ignores writes after close/cancel. */
export class SseWriter {
  #controller: ReadableStreamDefaultController<Uint8Array>;
  #closed = false;

  constructor(controller: ReadableStreamDefaultController<Uint8Array>) {
    this.#controller = controller;
  }

  get closed(): boolean {
    return this.#closed;
  }

  send(ev: AdvisorEvent): void {
    this.#write(encodeSseEvent(ev));
  }

  keepAlive(): void {
    this.#write(SSE_KEEPALIVE);
  }

  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    try {
      this.#controller.close();
    } catch {
      // already closed by the consumer
    }
  }

  /** Marks the writer closed when the client disconnects (ReadableStream cancel). */
  markCancelled(): void {
    this.#closed = true;
  }

  #write(chunk: string): void {
    if (this.#closed) return;
    try {
      this.#controller.enqueue(encoder.encode(chunk));
    } catch {
      this.#closed = true;
    }
  }
}

/** Parses an SSE body into events (used by tests and tooling; tolerant of comments). */
export function parseSse(body: string): { event: string; data: unknown }[] {
  const out: { event: string; data: unknown }[] = [];
  for (const chunk of body.split(/\n\n/)) {
    let event = 'message';
    const dataLines: string[] = [];
    for (const line of chunk.split('\n')) {
      if (line.startsWith(':') || line.trim() === '') continue;
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''));
    }
    if (dataLines.length === 0) continue;
    const raw = dataLines.join('\n');
    let data: unknown = raw;
    try {
      data = JSON.parse(raw);
    } catch {
      // keep raw string
    }
    out.push({ event, data });
  }
  return out;
}
