import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { LangProvider } from '../i18n/index.tsx';
import { RouteEffects, titleKeyFor } from './RouteEffects.tsx';

describe('RouteEffects', () => {
  it('maps routes to screen-name keys by longest prefix', () => {
    expect(titleKeyFor('/')).toBe('nav.home');
    expect(titleKeyFor('/workouts/ready/abc')).toBe('nav.workouts');
    expect(titleKeyFor('/nutrition/menu')).toBe('nav.nutrition');
    expect(titleKeyFor('/nope')).toBe('app.name');
  });
  it('sets a per-screen document title and the English manifest in English', () => {
    document.head.insertAdjacentHTML('beforeend', '<link rel="manifest" href="/manifest.webmanifest">');
    render(<LangProvider initialLang="en"><MemoryRouter initialEntries={['/coach']}><RouteEffects /></MemoryRouter></LangProvider>);
    expect(document.title).toBe('Coach · LUPU-FIT');
    expect(document.querySelector('link[rel="manifest"]')?.getAttribute('href')).toBe('/manifest.en.webmanifest');
  });
  it('uses the Hebrew title and manifest in Hebrew', () => {
    render(<LangProvider initialLang="he"><MemoryRouter initialEntries={['/progress']}><RouteEffects /></MemoryRouter></LangProvider>);
    expect(document.title).toBe('התקדמות · LUPU-FIT');
    expect(document.querySelector('link[rel="manifest"]')?.getAttribute('href')).toBe('/manifest.webmanifest');
  });
});
