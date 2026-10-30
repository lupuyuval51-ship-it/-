import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SPORTS, type Locale, type SportId } from '@shared/constants';
import type { SessionExerciseDTO } from '@shared/types';
import { I18nProvider, useI18n } from '../../i18n';
import { ExerciseOverview } from './ExerciseOverview';
import { sportLabel } from './format';
import { FinisherBanner, SportFinisherLine } from './SportSection';

const wrap = (ui: ReactElement, locale: Locale = 'en') => render(<I18nProvider locale={locale}>{ui}</I18nProvider>);

function ex(id: string, sport: SportId | null = null, done = 0): SessionExerciseDTO {
  return {
    id,
    exerciseId: id,
    exercise: { name: { en: `Move ${id}`, he: `תרגיל ${id}` } },
    sport,
    sets: [1, 2].map((n) => ({ id: `${id}-${n}`, setNumber: n, completed: n <= done })),
  } as unknown as SessionExerciseDTO;
}

const ready = [ex('a', null, 2), ex('b'), ex('c', 'soccer'), ex('d', 'soccer')];

describe('ExerciseOverview', () => {
  it('is one plain list without headings when the workout has no finisher', () => {
    const { container } = wrap(<ExerciseOverview exercises={[ex('a'), ex('b')]} index={0} onSelect={() => {}} />);
    expect(screen.queryByRole('heading')).toBeNull();
    expect(container.querySelectorAll('ol')).toHaveLength(1);
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('puts a heading with the sport and the duration before the first finisher exercise', () => {
    const { container } = wrap(<ExerciseOverview exercises={ready} index={1} onSelect={() => {}} />);
    const heading = screen.getByRole('heading', { name: 'Sport finisher - Soccer' });
    expect(heading.tagName).toBe('H3');
    const section = screen.getByRole('region', { name: 'Sport finisher - Soccer' });
    expect(section.contains(heading)).toBe(true);
    expect(within(section).getByText('About 10 minutes')).toBeTruthy();
    // Only the finisher exercises sit under the heading; the main ones stay above it, in order.
    expect(within(section).getAllByRole('button').map((b) => b.textContent)).toEqual([expect.stringContaining('Move c'), expect.stringContaining('Move d')]);
    const all = Array.from(container.querySelectorAll('button')).map((b) => b.textContent ?? '');
    expect(all.findIndex((t) => t.includes('Move b'))).toBeLessThan(all.findIndex((t) => t.includes('Move c')));
    // The numbering continues across the sections.
    expect(within(section).getByText('3')).toBeTruthy();
    expect(section.querySelector('ol')!.getAttribute('start')).toBe('3');
  });

  it('keeps marking the current and finished exercises and selects by index in the whole workout', () => {
    const onSelect = vi.fn();
    wrap(<ExerciseOverview exercises={ready} index={2} onSelect={onSelect} />);
    expect(screen.getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'step')).toHaveLength(1);
    expect(screen.getByText('Current')).toBeTruthy();
    expect(screen.getByText('Done')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Move d/ }));
    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it('names exercises added after the finisher so they are not mistaken for it', () => {
    wrap(<ExerciseOverview exercises={[...ready, ex('e')]} index={0} onSelect={() => {}} />);
    const other = screen.getByRole('heading', { name: 'Other exercises' });
    expect(within(other.closest('section')!).getByRole('button', { name: /Move e/ })).toBeTruthy();
    expect(screen.getAllByRole('heading')).toHaveLength(2);
  });

  it('gives two instances (side panel and dialog) their own heading ids', () => {
    wrap(
      <>
        <ExerciseOverview exercises={ready} index={0} onSelect={() => {}} />
        <ExerciseOverview exercises={ready} index={0} onSelect={() => {}} />
      </>,
    );
    const ids = screen.getAllByRole('heading', { name: 'Sport finisher - Soccer' }).map((h) => h.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('is in Hebrew with the Hebrew sport name', () => {
    wrap(<ExerciseOverview exercises={ready} index={0} onSelect={() => {}} />, 'he');
    expect(screen.getByRole('heading', { name: 'סיום לספורט - כדורגל' })).toBeTruthy();
    expect(screen.getByText('כ-10 דקות')).toBeTruthy();
  });
});

describe('FinisherBanner', () => {
  it('says which sport the finisher is for, how far along it is and about how long it takes', () => {
    wrap(<FinisherBanner sport="basketball" position={2} total={4} />);
    const heading = screen.getByRole('heading', { name: 'Sport finisher - Basketball' });
    expect(heading.tagName).toBe('H2');
    expect(screen.getByRole('region', { name: 'Sport finisher - Basketball' }).contains(heading)).toBe(true);
    expect(screen.getByText('Finisher exercise 2 of 4 · About 10 minutes')).toBeTruthy();
  });

  it('is in Hebrew', () => {
    wrap(<FinisherBanner sport="swimming" position={1} total={3} />, 'he');
    expect(screen.getByRole('heading', { name: 'סיום לספורט - שחייה' })).toBeTruthy();
    expect(screen.getByText('תרגיל סיום 1 מתוך 3 · כ-10 דקות')).toBeTruthy();
  });
});

describe('SportFinisherLine and sportLabel', () => {
  it('prints one line with the sport name', () => {
    wrap(<SportFinisherLine sport="climbing" />);
    expect(screen.getByText('Sport finisher: Climbing')).toBeTruthy();
  });

  it('has a distinct label in both languages for every sport', () => {
    for (const locale of ['en', 'he'] as const) {
      const labels: string[] = [];
      const Probe = () => {
        const i18n = useI18n();
        labels.push(...SPORTS.map((s) => sportLabel(i18n, s)));
        return null;
      };
      wrap(<Probe />, locale);
      expect(new Set(labels).size).toBe(SPORTS.length);
      cleanup();
    }
  });

  it('falls back to the general label for a sport this client does not know', () => {
    wrap(<SportFinisherLine sport={'archery' as SportId} />);
    expect(screen.getByText('Sport finisher: Other sport / general fitness')).toBeTruthy();
  });
});
