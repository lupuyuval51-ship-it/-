/** Both languages must define exactly the same keys — enforced at compile time. */
export function defineDict<const E extends Record<string, string>>(en: E, he: Record<keyof E, string>): { en: E; he: Record<keyof E, string> } {
  return { en, he };
}
