import { aiErrorFrom } from '../functions';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

function httpError(status: number, body: unknown, json = true) {
  const response = {
    status,
    clone() {
      return this;
    },
    json: async () => {
      if (!json) throw new SyntaxError('Unexpected token');
      return body;
    },
  };
  return { name: 'FunctionsHttpError', message: 'Edge Function returned a non-2xx status code', context: response };
}

describe('aiErrorFrom', () => {
  it('extracts the typed AiErrorBody code', async () => {
    const e = await aiErrorFrom(httpError(429, { error: { code: 'quota_exceeded', message: 'Monthly quota reached' } }));
    expect(e).toMatchObject({ code: 'quota_exceeded', status: 429, messageKey: 'errors.quotaExceeded' });
  });

  it('falls back to the HTTP status for unknown or non-JSON bodies', async () => {
    expect((await aiErrorFrom(httpError(503, { error: { code: 'weird' } }))).code).toBe('ai_unavailable');
    expect((await aiErrorFrom(httpError(401, null, false))).code).toBe('session_expired');
  });

  it('maps transport errors', async () => {
    expect((await aiErrorFrom({ name: 'FunctionsFetchError', message: 'Failed to send a request', context: {} })).code).toBe('network');
    expect((await aiErrorFrom(new TypeError('Network request failed'))).code).toBe('network');
  });
});
