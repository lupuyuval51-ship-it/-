import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import { ExerciseAnimation } from './ExerciseAnimation';

/** Manual requestAnimationFrame driver so tests control time. */
let now = 0;
let callbacks: Map<number, FrameRequestCallback>;
let nextId = 1;
const frame = (ms: number) => {
  now += ms;
  const due = [...callbacks.entries()];
  callbacks.clear();
  act(() => due.forEach(([, cb]) => cb(now)));
};

function renderPlayer(props: Partial<React.ComponentProps<typeof ExerciseAnimation>> = {}, locale: 'en' | 'he' = 'en') {
  return render(
    <I18nProvider locale={locale}>
      <ExerciseAnimation exerciseId="barbell_back_squat" {...props} />
    </I18nProvider>,
  );
}

beforeEach(() => {
  now = 0;
  nextId = 1;
  callbacks = new Map();
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    const id = nextId++;
    callbacks.set(id, cb);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => void callbacks.delete(id));
});
afterEach(() => vi.unstubAllGlobals());

describe('ExerciseAnimation player', () => {
  it('keeps the existing contract: .anim root, ltr role=img svg, Pause/Play toggle', () => {
    const { container } = renderPlayer();
    expect(container.querySelector('.anim')).not.toBeNull();
    const svg = screen.getByRole('img');
    expect(svg.getAttribute('direction')).toBe('ltr');
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
  });

  it('offers a Restart button (not "Replay") that rewinds to the first pose and resumes', () => {
    const { container } = renderPlayer();
    const geometry = () => container.querySelector('.anim-svg')!.innerHTML;
    const initial = geometry();
    frame(16);
    frame(1200);
    expect(geometry()).not.toBe(initial);
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }));
    expect(screen.queryByRole('button', { name: /replay/i })).toBeNull();
    expect(geometry()).toBe(initial);
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
  });

  it('offers 0.25x / 0.5x / 1x speeds that really slow playback down', () => {
    const { container } = renderPlayer();
    const group = screen.getByRole('radiogroup', { name: 'Playback speed' });
    const radios = within(group).getAllByRole('radio');
    expect(radios.map((r) => r.textContent)).toEqual(['¼×', '½×', '1×']);
    expect(within(group).getByRole('radio', { name: '1×' }).getAttribute('aria-checked')).toBe('true');
    const after = (ms: number) => {
      frame(16);
      frame(ms);
      return container.querySelector('.anim-svg')!.innerHTML;
    };
    // Same elapsed time at 1x and 0.25x ends in different poses; 0.25x equals 1x after a quarter of the time.
    const fast = after(1000);
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }));
    fireEvent.click(within(group).getByRole('radio', { name: '¼×' }));
    expect(within(group).getByRole('radio', { name: '¼×' }).getAttribute('aria-checked')).toBe('true');
    const slow = after(1000);
    expect(slow).not.toBe(fast);
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }));
    fireEvent.click(within(group).getByRole('radio', { name: '1×' }));
    expect(after(250)).toBe(slow);
  });

  it('shows the phase label from the manifest and updates it while playing', () => {
    renderPlayer({}, 'en');
    expect(screen.getByText('Start')).toBeTruthy();
    frame(16);
    frame(1500);
    expect(screen.queryByText('Start')).toBeNull();
    expect(screen.getByText(/Lowering|Bottom|Lifting/)).toBeTruthy();
  });

  it('localises the new controls into Hebrew', () => {
    renderPlayer({}, 'he');
    expect(screen.getByRole('button', { name: 'מההתחלה' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'השהיה' })).toBeTruthy();
    expect(screen.getByText('התחלה')).toBeTruthy();
  });

  it('shows a graceful "demo unavailable" state only when asked, otherwise renders nothing', () => {
    const { container, rerender } = render(
      <I18nProvider locale="en">
        <ExerciseAnimation exerciseId="not_an_exercise" />
      </I18nProvider>,
    );
    expect(container.querySelector('.anim')).toBeNull();
    rerender(
      <I18nProvider locale="en">
        <ExerciseAnimation exerciseId="not_an_exercise" showUnavailable />
      </I18nProvider>,
    );
    expect(screen.getByText('Demo unavailable')).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('treats a blocked animation as unavailable', () => {
    renderPlayer({ exerciseId: 'worlds_greatest_stretch', showUnavailable: true });
    expect(screen.getByText('Demo unavailable')).toBeTruthy();
  });

  it('pauses while off-screen (IntersectionObserver)', () => {
    let notify: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
          notify = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    renderPlayer();
    expect(callbacks.size).toBe(1);
    act(() => notify!([{ isIntersecting: false }]));
    expect(callbacks.size).toBe(0);
    act(() => notify!([{ isIntersecting: true }]));
    expect(callbacks.size).toBe(1);
  });
});

describe('ExerciseAnimation with reduced motion', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }));
  });

  it('does not autoplay: shows the start and end poses with a "Show motion" button', () => {
    renderPlayer();
    expect(callbacks.size).toBe(0);
    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(screen.getByText('Start position')).toBeTruthy();
    expect(screen.getByText('End of the movement')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Pause' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Show motion' })).toBeTruthy();
  });

  it('starts the normal player only after "Show motion"', () => {
    renderPlayer();
    fireEvent.click(screen.getByRole('button', { name: 'Show motion' }));
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
    expect(callbacks.size).toBe(1);
  });
});
