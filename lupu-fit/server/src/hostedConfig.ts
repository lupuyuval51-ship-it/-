/** Start-up checks of the hosted entry (`index.ts`): a missing setting is a refusal to start, never a quiet dev-grade default. */
export function hostedConfigProblem(env: Record<string, string | undefined>): string | null {
  if (!env['DATABASE_URL']) return 'DATABASE_URL is required';
  if (env['NODE_ENV'] !== 'production') return 'NODE_ENV=production is required for the hosted server (server/src/devServer.ts is the local development entry)';
  if (env['TRUST_PROXY'] === undefined || env['TRUST_PROXY'] === '') return 'TRUST_PROXY is required: the number of reverse proxies in front (e.g. 1 behind Caddy or Render), their addresses, or false when clients connect directly';
  if (env['TRUST_PROXY'] === 'true') return 'TRUST_PROXY=true trusts every X-Forwarded-For hop; set the number of proxies in front (e.g. 1) or their addresses';
  return null;
}
