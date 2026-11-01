import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { profileResponse, renderWith } from '../components/nutrition/testHarness.tsx';

vi.mock('../api/client.ts', async (orig) => {
  const real = await orig<typeof import('../api/client.ts')>();
  return { ...real, api: { ...real.api, get: async () => profileResponse() } };
});
// Only breakfast dishes exist => lunch / dinner / snack cannot be filled.
vi.mock('../data/content.ts', async (orig) => {
  const real = await orig<typeof import('../data/content.ts')>();
  const DISHES = real.DISHES.filter((d) => d.slots.length === 1 && d.slots[0] === 'breakfast');
  return { ...real, DISHES, DISH_BY_ID: new Map(DISHES.map((d) => [d.id, d])) };
});
const { default: NutritionMenu } = await import('./NutritionMenu.tsx');

describe('NutritionMenu missing slots', () => {
  it('tells the user which slots could not be filled instead of inventing dishes', async () => {
    renderWith(<NutritionMenu />, { route: '/nutrition/menu?date=2026-05-01' });
    expect(await screen.findByText(/No suitable dish was found for: Lunch, Dinner, Snack/)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
    expect(screen.getByTestId('allergen-disclaimer')).toBeInTheDocument();
  });
});
