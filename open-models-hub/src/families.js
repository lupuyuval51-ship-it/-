// Display families, keyed by the org prefix of a model id (OpenRouter slug / Hugging Face org).
// `order` pins the families people ask for most; everything else sorts by model count.
export const FAMILIES = {
  qwen: { label: 'Qwen', org: 'Alibaba', order: 1 },
  deepseek: { label: 'DeepSeek', org: 'DeepSeek', order: 2 },
  moonshotai: { label: 'Kimi', org: 'Moonshot AI', order: 3 },
  'z-ai': { label: 'GLM', org: 'Z.ai', order: 4 },
  minimax: { label: 'MiniMax', org: 'MiniMax', order: 5 },
  openai: { label: 'gpt-oss', org: 'OpenAI', order: 6 },
  'meta-llama': { label: 'Llama', org: 'Meta', order: 7 },
  meta: { label: 'Meta', org: 'Meta', order: 8 },
  mistralai: { label: 'Mistral', org: 'Mistral AI', order: 9 },
  google: { label: 'Gemma', org: 'Google', order: 10 },
  nvidia: { label: 'Nemotron', org: 'NVIDIA', order: 11 },
  xiaomi: { label: 'MiMo', org: 'Xiaomi', order: 12 },
  tencent: { label: 'Hunyuan', org: 'Tencent', order: 13 },
  microsoft: { label: 'Phi / Microsoft', org: 'Microsoft', order: 14 },
  stepfun: { label: 'Step', org: 'StepFun', order: 15 },
  'ibm-granite': { label: 'Granite', org: 'IBM', order: 16 }
};

// For ids without an org prefix (Ollama tags such as "qwen3:8b").
const GUESS = [
  [/^qwen|^qwq/i, 'qwen'], [/^deepseek/i, 'deepseek'], [/^kimi/i, 'moonshotai'], [/^glm/i, 'z-ai'],
  [/^minimax/i, 'minimax'], [/^gpt-oss/i, 'openai'], [/^llama/i, 'meta-llama'],
  [/^(mistral|mixtral|ministral|devstral|codestral)/i, 'mistralai'], [/^gemma/i, 'google'],
  [/^nemotron/i, 'nvidia'], [/^phi/i, 'microsoft'], [/^granite/i, 'ibm-granite']
];

export function authorOf(id) {
  const raw = String(id || '');
  const slash = raw.indexOf('/');
  if (slash > 0) return raw.slice(0, slash).toLowerCase();
  for (const [re, author] of GUESS) if (re.test(raw)) return author;
  return 'other';
}

export function familyOf(id) {
  const author = authorOf(id);
  // Google ships closed Gemini too; only the open Gemma line belongs here.
  const known = FAMILIES[author];
  if (known) return { id: author, label: known.label, org: known.org, order: known.order };
  const label = author === 'other' ? 'Other' : author.replace(/(^|[-_])(\w)/g, (_, s, c) => (s ? ' ' : '') + c.toUpperCase());
  return { id: author, label, org: label, order: 100 };
}
