import { Platform, Share } from 'react-native';

/** Shares plain text with the system share sheet; falls back to clipboard-free no-op on unsupported web browsers. */
export async function shareText(message: string, title?: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { share?: (data: { title?: string; text: string }) => Promise<void> }) : undefined;
      if (nav?.share) {
        await nav.share({ title, text: message });
        return true;
      }
      return false;
    }
    await Share.share({ message, title });
    return true;
  } catch {
    return false;
  }
}
