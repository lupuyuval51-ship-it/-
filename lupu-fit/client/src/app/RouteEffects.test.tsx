import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Link, MemoryRouter } from 'react-router';
import { LangProvider } from '../i18n/index.tsx';
import { RouteEffects, restoreScroll, titleKeyFor } from './RouteEffects.tsx';

const LINK_TEXT = 'next screen';

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
  it('a new screen starts at the top', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    render(<LangProvider initialLang="en"><MemoryRouter initialEntries={['/coach']}><RouteEffects /><Link to="/progress">{LINK_TEXT}</Link></MemoryRouter></LangProvider>);
    scrollTo.mockClear();
    fireEvent.click(screen.getByText(LINK_TEXT));
    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 })));
    scrollTo.mockRestore();
  });
  it('restoreScroll goes to the saved offset, or to the top for 0', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    restoreScroll(0);
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: 0 }));
    restoreScroll(240, 0);
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: 240 }));
    scrollTo.mockRestore();
  });
});
