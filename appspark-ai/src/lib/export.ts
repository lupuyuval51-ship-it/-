import { Platform } from 'react-native';

/**
 * Exports a text file. Native: writes to the cache directory and opens the
 * share sheet. Web: triggers a download. Returns false when nothing happened.
 */
export async function exportTextFile(fileName: string, content: string, mimeType = 'text/markdown'): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof document === 'undefined') return false;
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  }
  try {
    const [{ File, Paths }, Sharing] = await Promise.all([import('expo-file-system'), import('expo-sharing')]);
    const file = new File(Paths.cache, fileName);
    if (!file.exists) file.create();
    file.write(content);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: fileName, UTI: 'net.daringfireball.markdown' });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
