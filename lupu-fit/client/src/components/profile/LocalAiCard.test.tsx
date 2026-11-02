import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { LocalModelController, setControllerForTests } from '../../ai/local/controller.ts';
import { baseStatus, makeMock, type MockLocalAi } from '../../ai/local/mockPlugin.ts';
import { readModelConfig } from '../../ai/local/modelConfig.ts';
import { getMode, getWifiOnly } from '../../ai/local/settings.ts';
import { renderWith } from '../nutrition/testHarness.tsx';
import { LocalAiCard } from './LocalAiCard.tsx';

function mount(st: Parameters<typeof makeMock>[0]): MockLocalAi {
  localStorage.clear(); localStorage.setItem('lf_lang', 'en');
  const ai = makeMock(st); setControllerForTests(new LocalModelController(ai, readModelConfig({})));
  renderWith(<LocalAiCard />); return ai;
}
beforeEach(() => setControllerForTests(null));

describe('LocalAiCard', () => {
  it('web / not the Android app: download is disabled with an explanation', async () => {
    mount({ supported: false, reason: 'Android app only', reasonCode: 'platform' });
    expect(await screen.findByTestId('localai-block')).toHaveTextContent('Android app only');
    expect(screen.getByRole('button', { name: /^Download/ })).toBeDisabled();
  });
  it('unsupported phone shows the localized reason', async () => {
    mount({ supported: false, reason: 'Not enough memory', reasonCode: 'ram' });
    expect(await screen.findByTestId('localai-block')).toHaveTextContent('6 GB');
    expect(screen.getByRole('button', { name: /^Download/ })).toBeDisabled();
  });
  it('not enough free space disables the download and says how much is needed', async () => {
    mount({ freeBytes: 1e9 });
    expect(await screen.findByTestId('localai-block')).toHaveTextContent('3.1 GB');
    expect(screen.getByRole('button', { name: /^Download/ })).toBeDisabled();
  });
  it('downloads on tap, then shows Installed with a confirmed Delete', async () => {
    const ai = mount({});
    const btn = await screen.findByRole('button', { name: 'Download (2.6 GB)' });
    expect(btn).toBeEnabled(); expect(screen.getByTestId('localai-status')).toHaveTextContent('Not installed');
    await userEvent.click(btn);
    await waitFor(() => expect(screen.getByTestId('localai-status')).toHaveTextContent('Installed'));
    expect(ai.calls.download).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: 'Delete the model' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.getByTestId('localai-status')).toHaveTextContent('Not installed'));
  });
  it('shows progress with a cancel button while downloading', async () => {
    const ai = mount({});
    let finish!: () => void; ai.onDownload = () => new Promise<void>((r) => { finish = r; });
    await userEvent.click(await screen.findByRole('button', { name: /^Download/ }));
    act(() => ai.emitProgress({ phase: 'downloading', receivedBytes: 1_294_073_856, totalBytes: 2_588_147_712 }));
    await waitFor(() => expect(screen.getByTestId('localai-status')).toHaveTextContent('Downloading 50%'));
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel download' })); expect(ai.calls.cancel).toBe(1);
    finish();
  });
  it('interrupted download offers resume and keeps the error honest', async () => {
    mount({ partialBytes: 1_294_073_856, freeBytes: 5e9 });
    expect(await screen.findByRole('button', { name: 'Resume download' })).toBeEnabled();
    expect(screen.getByText(/paused at 50%/)).toBeInTheDocument();
  });
  it('mode control and Wi-Fi-only default / persistence', async () => {
    mount({});
    expect(await screen.findByRole('radio', { name: 'Auto' })).toHaveAttribute('aria-checked', 'true');
    expect(getWifiOnly()).toBe(true); expect(screen.getByRole('switch', { name: 'Download on Wi-Fi only' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'On-device only' }));
    expect(getMode()).toBe('local'); expect(screen.getByTestId('localai-mode-hint')).toHaveTextContent('No cloud AI service');
    await userEvent.click(screen.getByRole('switch', { name: 'Download on Wi-Fi only' })); expect(getWifiOnly()).toBe(false);
  });
  it('shows the honest notes and the license link', async () => {
    mount({});
    expect(await screen.findByText(/can be slow on weaker phones/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Gemma 4 license' })).toHaveAttribute('href', expect.stringContaining('ai.google.dev/gemma'));
  });
  it('baseStatus helper stays consistent', () => { expect(baseStatus().supported).toBe(true); });
});
