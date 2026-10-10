/**
 * End-of-rest signals: a short beep (Web Audio, respects the mute preference), a
 * vibration on supporting devices and — when the tab is hidden and permission was
 * granted — a system notification. Scheduled from the timer's end timestamp, so it
 * fires on time even when interval timers are throttled.
 */
import { useEffect, useRef } from 'react';
import { timerStatus, type RestTimerState } from '@shared/timer';
import type { WorkoutSessionDTO } from '@shared/types';
import { useI18n } from '../../i18n';
import { serverNow } from './clock';
import { prefersReducedMotion, readPrefs } from './prefs';
import { readTimerMuted } from './storage';

type AudioCtor = typeof AudioContext;
let audioCtx: AudioContext | null = null;

function audioContextClass(): AudioCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/** Creates/resumes the audio context; call from a user gesture (browsers block audio otherwise). */
export function primeAudio(): void {
  try {
    const Ctor = audioContextClass();
    if (!Ctor) return;
    audioCtx ??= new Ctor();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
  } catch {
    /* audio unavailable */
  }
}

export function playBeep(): void {
  try {
    const Ctor = audioContextClass();
    if (!Ctor) return;
    audioCtx ??= new Ctor();
    const ctx = audioCtx;
    if (ctx.state === 'suspended') void ctx.resume();
    const start = ctx.currentTime + 0.01;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = i === 2 ? 1175 : 880;
      const t0 = start + i * 0.28;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.22);
    }
  } catch {
    /* audio unavailable */
  }
}

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function signalRestOver(texts: { title: string; body: string }): void {
  if (!readTimerMuted()) playBeep();
  if (readPrefs().vibrate && !prefersReducedMotion()) {
    try {
      navigator.vibrate?.([200, 100, 200]);
    } catch {
      /* vibration unavailable */
    }
  }
  if (notificationsSupported() && Notification.permission === 'granted' && document.visibilityState === 'hidden') {
    try {
      new Notification(texts.title, { body: texts.body, tag: 'fitai-rest-timer' });
    } catch {
      /* some platforms only allow notifications from a service worker */
    }
  }
}

/** Signals once when a running rest timer of the active session reaches zero. */
export function useRestAlarm(session: WorkoutSessionDTO | null | undefined): void {
  const { t } = useI18n();
  const timer: RestTimerState | null = session?.restTimer ?? null;
  const endsAt = timer?.endsAt ?? null;
  const fired = useRef<string | null>(null);
  const texts = useRef({ title: '', body: '' });
  texts.current = { title: t('session.timer.notificationTitle'), body: t('session.timer.notificationBody') };

  useEffect(() => {
    if (!timer || !endsAt || timerStatus(timer, serverNow()) !== 'running') return;
    const delay = Date.parse(endsAt) - serverNow();
    const id = window.setTimeout(() => {
      if (fired.current === endsAt) return;
      fired.current = endsAt;
      signalRestOver(texts.current);
    }, Math.max(0, delay));
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt]);
}
