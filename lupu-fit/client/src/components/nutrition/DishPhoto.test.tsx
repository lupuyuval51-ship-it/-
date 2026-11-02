import { fireEvent, render } from '@testing-library/react';
import { DISHES } from '@lupu-fit/shared/content';
import { describe, expect, it } from 'vitest';
import { DishPhoto } from './DishPhoto.tsx';

describe('DishPhoto', () => {
  const id = DISHES[0]!.id;
  it('renders a decorative thumb for a dish with a photo and a captioned image in card size', () => {
    const { container, rerender } = render(<DishPhoto dishId={id} size="thumb" />);
    const thumb = container.querySelector('img.nu-thumb');
    expect(thumb?.getAttribute('src')).toBe(`/media/dishes/${id}.webp`);
    expect(thumb?.getAttribute('alt')).toBe('');
    const label = DISHES[0]!.nameEn;
    rerender(<DishPhoto dishId={id} alt={label} />);
    expect(container.querySelector('img.nu-photo')?.getAttribute('alt')).toBe(label);
  });
  it('renders nothing for missing/unknown ids and after a load error', () => {
    const { container, rerender } = render(<DishPhoto dishId={null} size="thumb" />);
    expect(container.firstChild).toBeNull();
    rerender(<DishPhoto dishId="not_a_dish" />);
    expect(container.firstChild).toBeNull();
    rerender(<DishPhoto dishId={id} />);
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    expect(container.firstChild).toBeNull();
  });
});
