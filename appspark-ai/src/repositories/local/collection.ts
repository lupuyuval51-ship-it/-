import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A tiny JSON collection on top of AsyncStorage with an in-memory cache.
 * Each collection is one key; the arrays are small (hundreds of items at most).
 */
export class LocalCollection<T> {
  private cache: T[] | null = null;
  private loading: Promise<T[]> | null = null;

  constructor(private readonly key: string) {}

  async read(): Promise<T[]> {
    if (this.cache) return this.cache;
    if (!this.loading) {
      this.loading = AsyncStorage.getItem(this.key)
        .then((raw) => {
          const parsed = raw ? (JSON.parse(raw) as unknown) : [];
          this.cache = Array.isArray(parsed) ? (parsed as T[]) : [];
          return this.cache;
        })
        .catch(() => {
          this.cache = [];
          return this.cache;
        })
        .finally(() => {
          this.loading = null;
        });
    }
    return this.loading;
  }

  async write(items: T[]): Promise<void> {
    this.cache = items;
    await AsyncStorage.setItem(this.key, JSON.stringify(items));
  }

  async clear(): Promise<void> {
    this.cache = [];
    await AsyncStorage.removeItem(this.key);
  }

  /** Drop the memory cache (tests). */
  reset(): void {
    this.cache = null;
  }
}

export const LOCAL_KEYS = {
  savedIdeas: 'appspark.local.savedIdeas.v1',
  projects: 'appspark.local.projects.v1',
  prompts: 'appspark.local.prompts.v1',
  generatedIdeas: 'appspark.local.generatedIdeas.v1',
  migratedAt: 'appspark.local.migratedAt.v1',
} as const;
