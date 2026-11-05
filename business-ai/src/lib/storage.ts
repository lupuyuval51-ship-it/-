/**
 * Small, failure-tolerant wrapper around AsyncStorage (localStorage on web) for device-local
 * preferences. Storage failures never crash the app: reads resolve to null, writes are best-effort.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  locale: 'businessai.pref.locale',
  localePendingSync: 'businessai.pref.locale.pendingSync',
  localeReloadGuard: 'businessai.pref.locale.reloadGuard',
  theme: 'businessai.pref.theme',
  themePendingSync: 'businessai.pref.theme.pendingSync',
  lastUserId: 'businessai.auth.lastUserId',
  activeBusiness: 'businessai.activeBusiness',
  queryCache: 'businessai.queryCache',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export async function readString(key: StorageKey): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function writeString(key: StorageKey, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // Best effort: preferences fall back to defaults next launch.
  }
}

export async function removeKey(key: StorageKey): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export async function readFlag(key: StorageKey): Promise<boolean> {
  return (await readString(key)) === '1';
}

export async function writeFlag(key: StorageKey, value: boolean): Promise<void> {
  if (value) await writeString(key, '1');
  else await removeKey(key);
}
