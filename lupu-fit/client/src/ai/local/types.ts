/** Shared types for the optional on-device AI (Gemma 4 via LiteRT-LM, Android app only). The native side is android/.../LocalAiPlugin.kt. */
export type AiMode = 'auto' | 'cloud' | 'local';
export type AiKind = 'coach' | 'translate';

export interface LocalStatus {
  installed: boolean;
  /** Size of the installed model file in bytes (0 when not installed). */
  sizeBytes: number;
  /** Bytes of an interrupted download that can be resumed. */
  partialBytes: number;
  modelId: string;
  backend: string;
  supported: boolean;
  /** Human-readable English reason when `supported` is false (also see `reasonCode`). */
  reason: string;
  reasonCode: '' | 'platform' | 'abi' | 'ram' | 'runtime';
  freeBytes: number;
  totalRamBytes: number;
  downloading: boolean;
  loaded: boolean;
}

export interface DownloadOptions { url: string; sha256: string; sizeBytes: number; wifiOnly: boolean; modelId?: string }
export interface DownloadProgress { phase: 'downloading' | 'verifying' | 'done' | 'error' | 'cancelled'; receivedBytes: number; totalBytes: number; error?: string }
export interface GenerateOptions { system: string; messages: { role: 'user' | 'assistant'; content: string }[]; maxTokens: number; json: boolean; stream: boolean; requestId: string }
export interface GenerateResult { text: string; backend: string; firstTokenMs: number; truncated: boolean }

/** Stable error codes. Native codes: unsupported, not_installed, busy, bad_request, aborted, timeout, engine_init_failed, generation_failed, no_space, wifi_required, sha_mismatch, size_mismatch, network, cancelled, io. */
export class LocalAiError extends Error {
  constructor(readonly code: string, message?: string) { super(message ?? code); this.name = 'LocalAiError'; }
}

export interface LocalAi {
  readonly native: boolean;
  status(): Promise<LocalStatus>;
  download(o: DownloadOptions): Promise<LocalStatus>;
  cancelDownload(): Promise<void>;
  delete(): Promise<LocalStatus>;
  generate(o: GenerateOptions): Promise<GenerateResult>;
  abort(): Promise<void>;
  onProgress(cb: (p: DownloadProgress) => void): () => void;
  onToken(cb: (e: { requestId: string; text: string }) => void): () => void;
}
