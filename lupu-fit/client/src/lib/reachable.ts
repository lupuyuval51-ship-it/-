import { useOnline } from '../components/live/OfflineBanner.tsx';
import { IS_DEVICE } from '../env.ts';

/**
 * Can the API answer right now? In Device Mode the API is the database worker on the phone, so it always can, whatever the network
 * says (only barcode lookup and the optional AI proxy need a connection). In the hosted build it follows `navigator.onLine`.
 */
export function useApiReachable(): boolean {
  const online = useOnline();
  return IS_DEVICE || online;
}
