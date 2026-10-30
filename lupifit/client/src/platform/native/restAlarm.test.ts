import { describe, expect, it, vi } from 'vitest';
import { REST_ALARM_ID, createNativeRestAlarm } from './restAlarm';
import { CHANNEL_ID, isReminderId } from './reminders';

function fakePlugin(display: 'granted' | 'denied' | 'prompt' = 'granted') {
  return {
    checkPermissions: vi.fn(async () => ({ display })),
    schedule: vi.fn(async () => ({ notifications: [] })),
    cancel: vi.fn(async () => undefined),
    removeDeliveredNotifications: vi.fn(async () => undefined),
    createChannel: vi.fn(async () => undefined),
  };
}
const texts = { title: 'Rest over', body: 'Time for the next set.' };
const channel = () => ({ name: 'Reminders', description: 'Workout and meal reminders' });

describe('native rest alarm', () => {
  it('schedules one inexact notification at the end of the rest, replacing the previous one', async () => {
    const plugin = fakePlugin();
    const alarm = createNativeRestAlarm({ plugin: plugin as never, channel, now: () => 1_000_000 });
    await alarm.schedule(1_090_000, texts);
    expect(plugin.cancel).toHaveBeenCalledWith({ notifications: [{ id: REST_ALARM_ID }] });
    expect(plugin.createChannel).toHaveBeenCalledWith(expect.objectContaining({ id: CHANNEL_ID }));
    const [{ notifications }] = plugin.schedule.mock.calls[0] as unknown as [{ notifications: { id: number; schedule: { at: Date }; isExactNotification: boolean; title: string }[] }];
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({ id: REST_ALARM_ID, title: 'Rest over', isExactNotification: false });
    expect(notifications[0]!.schedule.at.getTime()).toBe(1_090_000);
  });

  it('never asks for permission: without it nothing is scheduled', async () => {
    const plugin = fakePlugin('prompt');
    await createNativeRestAlarm({ plugin: plugin as never, channel, now: () => 0 }).schedule(90_000, texts);
    expect(plugin.schedule).not.toHaveBeenCalled();
  });

  it('cancels it and clears it from the shade when the rest is skipped or finished', async () => {
    const plugin = fakePlugin();
    const alarm = createNativeRestAlarm({ plugin: plugin as never, channel, now: () => 0 });
    await alarm.schedule(90_000, texts);
    await alarm.cancel();
    expect(plugin.cancel).toHaveBeenLastCalledWith({ notifications: [{ id: REST_ALARM_ID }] });
    expect(plugin.removeDeliveredNotifications).toHaveBeenLastCalledWith({ notifications: [expect.objectContaining({ id: REST_ALARM_ID })] });
  });

  it('uses an id the reminder sync never touches', () => {
    expect(isReminderId(REST_ALARM_ID)).toBe(false);
  });
});
