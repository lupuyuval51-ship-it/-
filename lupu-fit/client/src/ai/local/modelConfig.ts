/**
 * Which model file the app downloads (never bundled in the AAB). Defaults to the public, NON-gated Gemma 4 E2B LiteRT-LM build,
 * pinned to a Hugging Face commit and verified by SHA-256 before it is used. Override at build time (no token is ever embedded):
 *   VITE_LOCAL_MODEL_URL, VITE_LOCAL_MODEL_SHA256, VITE_LOCAL_MODEL_SIZE (bytes), VITE_LOCAL_MODEL_ID
 * If you point the URL at a gated repo the plugin cannot authenticate: host the file yourself after accepting its license.
 */
export interface ModelConfig { url: string; sha256: string; sizeBytes: number; modelId: string }

const DEFAULTS: ModelConfig = {
  url: 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/1caa527c1e88b55f046fcd8d2b4265606680663d/gemma-4-E2B-it.litertlm',
  sha256: '181938105e0eefd105961417e8da75903eacda102c4fce9ce90f50b97139a63c',
  sizeBytes: 2_588_147_712,
  modelId: 'gemma-4-E2B-it',
};
/** Gemma 4 ships under Apache 2.0 (see the model card: license apache-2.0); older Gemma models use https://ai.google.dev/gemma/terms. */
export const GEMMA_LICENSE_URL = 'https://ai.google.dev/gemma/apache_2';
export const MODEL_CARD_URL = 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm';

export function readModelConfig(env: Record<string, string | undefined> = import.meta.env as Record<string, string | undefined>): ModelConfig {
  const url = env['VITE_LOCAL_MODEL_URL']?.trim();
  const sha = env['VITE_LOCAL_MODEL_SHA256']?.trim().toLowerCase();
  const size = Number(env['VITE_LOCAL_MODEL_SIZE']);
  if (url && /^https:\/\//.test(url) && sha && /^[0-9a-f]{64}$/.test(sha) && Number.isFinite(size) && size > 1_000_000) {
    return { url, sha256: sha, sizeBytes: Math.floor(size), modelId: env['VITE_LOCAL_MODEL_ID']?.trim() || 'custom-model' };
  }
  return DEFAULTS;
}
