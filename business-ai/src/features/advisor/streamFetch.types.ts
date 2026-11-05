/** The minimal fetch surface the advisor SSE client needs (satisfied by expo/fetch and WHATWG fetch). */
export interface StreamingResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly headers: { get(name: string): string | null };
  /** Null on runtimes without streaming bodies; the client then falls back to `text()`. */
  readonly body: ReadableStream<Uint8Array> | null;
  text(): Promise<string>;
}

export interface StreamingRequestInit {
  method: 'POST';
  headers: Record<string, string>;
  body: string;
  signal: AbortSignal;
}

export type StreamingFetch = (url: string, init: StreamingRequestInit) => Promise<StreamingResponse>;
