import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Trigger } from './schedule.ts';

const h = vi.hoisted(() => ({
  log: [] as string[], gate: null as null | Promise<void>, pending: [] as number[],
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: async () => ({ display: 'granted' }), requestPermissions: vi.fn(),
    getPending: async () => ({ notifications: h.pending.map((id) => ({ id })) }),
    cancel: async (o: { notifications: { id: number }[] }) => { h.log.push(`cancel:${o.notifications.map((n) => n.id).join(',')}`); h.pending = h.pending.filter((id) => !o.notifications.some((n) => n.id === id)); },
    createChannel: async () => { await h.gate; },
    schedule: async (o: { notifications: { id: number }[] }) => { h.log.push(`schedule:${o.notifications.map((n) => n.id).join(',')}`); h.pending.push(...o.notifications.map((n) => n.id)); },
    addListener: async () => ({ remove: async () => undefined }),
  },
}));
const { applySchedule, cancelAll } = await import('./delivery.ts');

const trig = (id: number): Trigger => ({ id, kind: 'workout', route: '/workouts', hour: 18, minute: 0, weekday: 1, repeats: true, at: null });
const text = () => ({ title: 't', body: 'b' });
const ch = { name: 'n', description: 'd' };
beforeEach(() => { h.log.length = 0; h.gate = null; h.pending = []; });

describe('reminder delivery under overlap', () => {
  it('a schedule run that is half way when the person logs out never lands after the cancel', async () => {
    let open!: () => void; h.gate = new Promise<void>((r) => { open = r; });
    const run = applySchedule([trig(101), trig(102)], text, ch);
    await new Promise((r) => setTimeout(r, 5)); // run is now waiting inside createChannel
    const out = cancelAll();
    open(); await Promise.all([run, out]);
    expect(h.pending).toEqual([]);
    expect(h.log.some((l) => l.startsWith('schedule:'))).toBe(false);
  });

  it('two overlapping runs end with exactly the newest set pending', async () => {
    let open!: () => void; h.gate = new Promise<void>((r) => { open = r; });
    const first = applySchedule([trig(101), trig(102), trig(103)], text, ch);
    await new Promise((r) => setTimeout(r, 5));
    const second = applySchedule([trig(102)], text, ch);
    open(); await Promise.all([first, second]);
    expect(h.pending).toEqual([102]);
  });

  it('cancelAll leaves nothing pending', async () => {
    h.pending = [101, 405];
    await cancelAll();
    expect(h.pending).toEqual([]);
  });
});
