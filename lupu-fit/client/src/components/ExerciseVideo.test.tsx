import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
