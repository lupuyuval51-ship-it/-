import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import { QuestAudio } from '../src/components/game/audio';

class FakeParam {
  value = 0;
  setTargetAtTime(value: number) { this.value = value; }
  setValueAtTime(value: number) { this.value = value; }
  exponentialRampToValueAtTime(value: number) { this.value = value; }
}
class FakeGain {
  gain = new FakeParam();
  disconnected = false;
  connect() {}
  disconnect() { this.disconnected = true; }
}
class FakeOscillator {
  frequency = new FakeParam();
  type = 'sine';
  onended: (() => void) | null = null;
  disconnected = false;
  stopped = false;
  connect() {}
  start() {}
  stop() { this.stopped = true; }
  disconnect() { this.disconnected = true; }
}

function audioHarness(t: TestContext, resume: 'immediate' | 'delayed' | 'rejected' = 'immediate') {
  const instances: FakeAudioContext[] = [];
  let schedulerStarts = 0;
  class FakeAudioContext {
    currentTime = 0;
    state = 'suspended';
    destination = {};
    gains: FakeGain[] = [];
    oscillators: FakeOscillator[] = [];
    pendingResume: (() => void) | undefined;
    closes = 0;
    constructor() { instances.push(this); }
    createGain() { const gain = new FakeGain(); this.gains.push(gain); return gain; }
    createOscillator() { const oscillator = new FakeOscillator(); this.oscillators.push(oscillator); return oscillator; }
    resume() {
      if (resume === 'rejected') return Promise.reject(new Error('Audio permission denied'));
      if (resume === 'delayed') return new Promise<void>(resolve => { this.pendingResume = () => { this.state = 'running'; resolve(); }; });
      this.state = 'running'; return Promise.resolve();
    }
    suspend() { this.state = 'suspended'; return resume === 'rejected' ? Promise.reject(new Error('Suspension denied')) : Promise.resolve(); }
    close() { this.state = 'closed'; this.closes++; return resume === 'rejected' ? Promise.reject(new Error('Close denied')) : Promise.resolve(); }
  }
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, value: FakeAudioContext });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, 'AudioContext', descriptor);
    else Reflect.deleteProperty(globalThis, 'AudioContext');
  });
  t.mock.method(globalThis, 'setInterval', () => { schedulerStarts++; return schedulerStarts; });
  t.mock.method(globalThis, 'clearInterval', () => {});
  return { instances, schedulerStarts: () => schedulerStarts };
}

test('game audio stays silent until enabled and caps concurrent voices during held fire', async t => {
  const harness = audioHarness(t);
  const audio = new QuestAudio('sky-island');
  t.after(() => audio.dispose());
  audio.configure(false, false);
  audio.effect(true);
  audio.pulse('shot');
  assert.equal(harness.instances.length, 0, 'Disabled sound must not create an AudioContext.');
  audio.configure(true, false);
  await Promise.resolve();
  const context = harness.instances[0];
  for (let shot = 0; shot < 100; shot++) audio.pulse('shot');
  assert.equal(context.oscillators.length, 32, 'Held fire cannot create unbounded audio nodes.');
  audio.configure(false, false);
  audio.effect(false);
  assert.equal(context.oscillators.length, 32);
  assert.equal(context.gains[1].gain.value, 0, 'The effects output channel is muted independently.');
  context.oscillators[0].onended?.();
  audio.configure(true, false);
  await Promise.resolve();
  audio.effect(false);
  assert.equal(context.oscillators.length, 33, 'Ended voices release capacity for later feedback.');
  assert.equal(harness.schedulerStarts(), 0, 'Effects alone must not start the music scheduler.');
  audio.dispose();
  audio.dispose();
  assert.equal(context.closes, 1);
  assert.ok(context.oscillators.every(oscillator => oscillator.disconnected));
  assert.ok(context.gains.every(gain => gain.disconnected));
});

test('a late AudioContext resume cannot restart music after pause or disposal', async t => {
  const harness = audioHarness(t, 'delayed');
  const paused = new QuestAudio();
  paused.configure(true, true);
  paused.pause();
  harness.instances[0].pendingResume?.();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(harness.instances[0].oscillators.length, 0);
  assert.equal(harness.schedulerStarts(), 0);
  paused.dispose();
  const disposed = new QuestAudio();
  disposed.configure(true, true);
  disposed.dispose();
  harness.instances[1].pendingResume?.();
  await Promise.resolve();
  await Promise.resolve();
  disposed.configure(true, true);
  assert.equal(harness.instances.length, 2);
  assert.equal(harness.instances[1].oscillators.length, 0);
  assert.equal(harness.schedulerStarts(), 0);
  assert.equal(harness.instances[1].closes, 1);
});

test('denied audio lifecycle promises leave gameplay sound inactive without unhandled rejections', async t => {
  const harness = audioHarness(t, 'rejected');
  const audio = new QuestAudio();
  audio.configure(true, true);
  await new Promise<void>(resolve => setImmediate(resolve));
  audio.pulse('collect');
  audio.pause();
  audio.dispose();
  await new Promise<void>(resolve => setImmediate(resolve));
  assert.equal(harness.instances[0].oscillators.length, 0);
  assert.equal(harness.schedulerStarts(), 0);
  assert.equal(harness.instances[0].closes, 1);
});
