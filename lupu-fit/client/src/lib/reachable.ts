import { useOnline } from '../components/live/OfflineBanner.tsx';

/**
 * Can the API answer right now? In Device Mode the API is the database worker on the phone, so it always can, whatever the network
 * says (`useOnline` already encodes that; only barcode lookup and the optional AI proxy need a connection). In the hosted build it
 * follows `navigator.onLine`.
 */
export function useApiReachable(): boolean {
  return useOnline();
}
