/** Small, dependency-free id generator (not cryptographic). */
export function createId(prefix = 'id'): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${time}${rand}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
