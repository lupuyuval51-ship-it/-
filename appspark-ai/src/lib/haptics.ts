import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Light haptic tick for selection changes. No-op on web. */
export async function tapFeedback(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // Haptics are best-effort.
  }
}

export async function successFeedback(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // ignore
  }
}
