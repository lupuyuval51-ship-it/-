/**
 * Server clock correction. Timers and the workout clock are computed from server
 * timestamps (startedAt, endsAt …), so the client estimates `server − client` from the
 * `serverTime` of each response (midpoint of the request) and uses `serverNow()`.
 */
let skewMs = 0;
let measured = false;

/** Records a fresh measurement (ignored when implausible, e.g. the request took very long). */
export function noteServerTime(serverTime: string, sentAt: number, receivedAt: number): void {
  const server = Date.parse(serverTime);
  if (!Number.isFinite(server) || receivedAt - sentAt > 10_000) return;
  skewMs = Math.round(server - (sentAt + receivedAt) / 2);
  measured = true;
}

/** Restores a previously measured skew (from the offline cache) unless a fresh one exists. */
export function restoreSkew(ms: number): void {
  if (!measured && Number.isFinite(ms)) skewMs = ms;
}

export function clockSkewMs(): number {
  return skewMs;
}

export function serverNow(clientNow: number = Date.now()): number {
  return clientNow + skewMs;
}
