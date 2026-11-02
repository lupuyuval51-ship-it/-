import { DISH_IMAGE_IDS } from '@lupu-fit/shared/content';
import { useState, type ReactNode } from 'react';

/** AI-generated illustration of a dish. Renders nothing when the dish has no photo or the file fails to load (offline, not cached).
 *  `thumb` is a small square decorative image next to a visible name (empty alt); `card` is the full-width image. */
export function DishPhoto({ dishId, alt, size = 'card' }: { dishId: string | null | undefined; alt?: string; size?: 'card' | 'thumb' }): ReactNode {
  const [failed, setFailed] = useState(false);
  if (!dishId || !DISH_IMAGE_IDS.has(dishId) || failed) return null;
  const src = `/media/dishes/${dishId}.webp`;
  if (size === 'thumb') return <img className="nu-thumb" src={src} alt="" aria-hidden="true" loading="lazy" decoding="async" width={56} height={56} onError={() => setFailed(true)} />;
  return <img className="nu-photo" src={src} alt={alt ?? ''} loading="lazy" decoding="async" width={640} onError={() => setFailed(true)} />;
}
