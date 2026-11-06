import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LangProvider } from '../i18n/index.tsx';
import { ExerciseVideo } from './ExerciseVideo.tsx';

const ALT = 'split_squat';
function view(fidelity: 'specific' | 'approximate' | null, lang: 'he' | 'en' = 'en') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['media-manifest'], new Map(fidelity ? [['split_squat', { id: 'split_squat', fidelity }]] : []));
  return render(<LangProvider initialLang={lang}><QueryClientProvider client={qc}><ExerciseVideo exerciseId="split_squat" alt={ALT} /></QueryClientProvider></LangProvider>);
}

describe('ExerciseVideo', () => {
  it('shows exactly one caption: the schematic note for a specific clip', () => {
    const { container } = view('specific');
    expect(screen.getByText('Schematic illustration, not filmed footage')).toBeInTheDocument();
    expect(screen.queryByText('Illustration')).toBeNull();
    expect(container.querySelectorAll('p.tiny')).toHaveLength(1);
  });
  it('says when a clip is only approximate (Hebrew too), still in one caption', () => {
    const { container } = view('approximate', 'he');
    expect(screen.getByText('המחשה מקורבת')).toBeInTheDocument();
    expect(container.querySelectorAll('p.tiny')).toHaveLength(1);
  });
  it('keeps the controls in their own row under the clip, never on top of it', () => {
    const { container } = view('specific');
    const media = container.querySelector('.xvid-media');
    const controls = container.querySelector('.xvid-controls');
    expect(media?.querySelector('video')).not.toBeNull();
    expect(controls).not.toBeNull();
    expect(media?.contains(controls)).toBe(false);
    expect(media?.nextElementSibling).toBe(controls);
  });
});

describe('ExerciseVideo: the clip list arrives after the first render', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it('autoplays once the <video> exists, and the Play button starts it when autoplay did not (it used to do nothing)', async () => {
    const play = vi.fn(() => Promise.resolve()); const pause = vi.fn();
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause);
    class InView { constructor(private cb: IntersectionObserverCallback) {} observe(el: Element) { this.cb([{ isIntersecting: true, intersectionRatio: 1, target: el } as IntersectionObserverEntry], this as unknown as IntersectionObserver); } unobserve() {} disconnect() {} takeRecords() { return []; } }
    vi.stubGlobal('IntersectionObserver', InView); // in view from the first frame, long before the clip list arrives
    let resolveManifest: (r: Response) => void = () => undefined;
    // The manifest module caches its promise: load a fresh copy for this test.
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((res) => { resolveManifest = res; })));
    const { ExerciseVideo: Fresh } = await import('./ExerciseVideo.tsx');
    const { LangProvider: Lang } = await import('../i18n/index.tsx');
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<Lang initialLang="en"><QueryClientProvider client={qc}><Fresh exerciseId="split_squat" alt={ALT} /></QueryClientProvider></Lang>);
    expect(document.querySelector('video')).toBeNull(); // no manifest yet: poster only
    await act(async () => { resolveManifest(new Response(JSON.stringify({ items: [{ id: 'split_squat', fidelity: 'specific', reviewed: false }] }))); });
    await screen.findByLabelText(ALT, { selector: 'video' });
    expect(play).toHaveBeenCalled(); // the effect re-ran when the element appeared
    play.mockClear();
    const video = document.querySelector('video') as HTMLVideoElement;
    Object.defineProperty(video, 'paused', { value: true, configurable: true }); // the browser refused autoplay: the element is paused
    fireEvent.click(screen.getByRole('button', { name: /^(Play|Pause)$/ }));
    expect(play).toHaveBeenCalled(); // an explicit tap plays even when nothing else changed
  });
});
