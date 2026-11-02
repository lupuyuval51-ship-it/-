import { DISH_IMAGE_IDS } from '@lupu-fit/shared/content';
import { useState, type ReactNode } from 'react';

/** AI-generated illustration of a dish. Renders nothing when the dish has no photo or the file fails to load (offline, not cached). */
export function DishPhoto({ dishId, alt }: { dishId: string; alt: string }): ReactNode {
  const [failed, setFailed] = useState(false);
  if (!DISH_IMAGE_IDS.has(dishId) || failed) return null;
  return <img className="nu-photo" src={`/media/dishes/${dishId}.webp`} alt={alt} loading="lazy" decoding="async" width={640} onError={() => setFailed(true)} />;
}
