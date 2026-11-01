import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { handlers, renderPage, resetApi, withProfile } from './test-harness.tsx';

vi.mock('../api/client.ts', async (orig) => ({ ...(await orig<typeof import('../api/client.ts')>()), api: (await import('./test-harness.tsx')).apiStub }));
const { default: ExerciseDetail } = await import('./ExerciseDetail.tsx');

const record = { maxWeight: 40, est1rm: 52.3, maxReps: 10, maxVolume: 400, maxDuration: null, updatedAt: '2026-10-01T10:00:00Z' };
const history = { exerciseId: 'push_up', history: [{ sessionId: 's1', date: '2026-10-01', sets: [{ setNo: 1, reps: 10, weightKg: 40, durationSec: null, rpe: 8 }] }], record };
const open = (lang: 'he' | 'en' = 'en', id = 'push_up', tab = 'history') => renderPage(<ExerciseDetail />, { lang, route: `/exercises/${id}?tab=${tab}`, path: '/exercises/:id' });

beforeEach(() => { resetApi(); handlers['GET /api/exercises/push_up/history'] = () => history; });

describe('ExerciseDetail', () => {
  it('shows the illustration label and 1RM for adults, with steps, cues and mistakes in tabs', async () => {
    handlers['GET /api/profile'] = () => withProfile({ age: 30 });
    open();
    expect(screen.getByRole('heading', { level: 1, name: 'Push-Up' })).toBeInTheDocument();
    expect(screen.getByText('Schematic illustration, not filmed footage')).toBeInTheDocument();
    expect(await screen.findByText('Estimated 1RM')).toBeInTheDocument();
    expect(screen.getByText('52.3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Mistakes' }));
    expect(await screen.findByText('Common mistakes')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Steps' }));
    expect(await screen.findByText('How to do it')).toBeInTheDocument();
    expect(screen.getByText(/^Safety:/)).toBeInTheDocument();
  });
  it('never shows 1RM estimates for minors', async () => {
    handlers['GET /api/profile'] = () => withProfile({ age: 15 });
    open();
    expect(await screen.findByText('Strength estimates are not shown for users under 18.')).toBeInTheDocument();
    expect(screen.queryByText('Estimated 1RM')).toBeNull();
    expect(screen.queryByText('52.3')).toBeNull();
    expect(screen.getByText('Best weight')).toBeInTheDocument();
  });
  it('hides 1RM while the age is unknown (profile missing)', async () => {
    open();
    expect(await screen.findByText('Best weight')).toBeInTheDocument();
    expect(screen.queryByText('Estimated 1RM')).toBeNull();
  });
  it('honest empty history and Hebrew copy', async () => {
    handlers['GET /api/exercises/push_up/history'] = () => ({ exerciseId: 'push_up', history: [], record: null });
    handlers['GET /api/profile'] = () => withProfile();
    open('he');
    expect(await screen.findByText(/עוד לא תועדו סטים בתרגיל הזה/)).toBeInTheDocument();
    expect(screen.getByText('שכיבות סמיכה', { selector: 'h1' })).toBeInTheDocument();
    expect(screen.getByText('המחשה סכמטית, לא צילום')).toBeInTheDocument();
  });
  it('flags alternatives that are unsafe for the user injuries', async () => {
    handlers['GET /api/profile'] = () => withProfile({ injuries: ['wrist', 'shoulder'] });
    open();
    expect((await screen.findAllByText('Not safe for you')).length).toBeGreaterThan(0);
  });
  it('handles unknown exercise ids', () => {
    open('en', 'not_a_real_id');
    expect(screen.getByText('Exercise not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to exercises' })).toHaveAttribute('href', '/exercises');
  });
});
