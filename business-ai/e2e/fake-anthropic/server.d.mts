/** Type declarations for server.mjs (used by the Deno tests via `// @ts-types`). */
import type { Server } from 'node:http';

export declare const FALLBACK_BETA: 'server-side-fallback-2026-07-01';

export interface FakeServerOptions {
  /** Log one JSON line per request to stdout (default: on unless FAKE_ANTHROPIC_QUIET=1). */
  log?: boolean;
  /** Artificial latency per response in ms. */
  delayMs?: number;
}

export declare function createFakeAnthropicServer(options?: FakeServerOptions): Server;

/** Deterministic schema-valid sample for a structured-outputs JSON Schema. */
export declare function generateSample(schema: Record<string, unknown>, options?: { lang?: 'he' | 'en' }): unknown;

/** Error message when a schema uses features structured outputs reject, else null. */
export declare function validateStrictSchema(schema: unknown, path?: string): string | null;

export declare function detectLanguage(body: { system?: unknown; messages?: unknown }): 'he' | 'en';

export declare function readConstraints(description: unknown): Record<string, unknown>;

export interface FakeMessage {
  id: string;
  type: 'message';
  role: 'assistant';
  model: string;
  content: Record<string, unknown>[];
  stop_reason: string;
  stop_sequence: null;
  stop_details: Record<string, unknown> | null;
  usage: Record<string, unknown>;
}

export declare function buildMessage(body: Record<string, unknown>): FakeMessage;

export declare function streamEvents(message: FakeMessage): [string, Record<string, unknown>][];

export declare function sampleValue(schema: unknown, ctx: unknown, key?: string, index?: number): unknown;
