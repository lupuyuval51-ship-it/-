/** Device mode: one-shot confirmations that survive the app's restart (a restored backup). */
import { useEffect } from 'react';
import { useToast } from '../../components/ui';
import { useI18n } from '../../i18n';
import { isDeviceMode } from '../../platform';
import { takeRestoredNote } from './control';

export function DeviceNotes() {
  const { t } = useI18n();
  const toast = useToast();
  useEffect(() => {
    if (isDeviceMode && takeRestoredNote()) toast.success(t('device.restore.done'));
    // Once per page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
