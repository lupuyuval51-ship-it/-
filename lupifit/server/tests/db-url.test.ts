/** Hosted database URLs (Neon, Render Postgres): TLS options, channel binding and pooler detection. */
import { describe, expect, it } from 'vitest';
import { connectionOptions, isTransactionPoolerUrl } from '../src/db/pool';

const NEON = 'postgresql://neondb_owner:pw@ep-cool-darkness-123456.eu-central-1.aws.neon.tech/neondb';

describe('connectionOptions', () => {
  it('keeps Neon’s URL fully verified and turns on channel binding', () => {
    expect(connectionOptions(`${NEON}?sslmode=require&channel_binding=require`)).toEqual({
      connectionString: `${NEON}?sslmode=verify-full&channel_binding=require`,
      enableChannelBinding: true,
    });
  });

  it('treats require / prefer / verify-ca as verify-full, as node-postgres 8 already does', () => {
    for (const mode of ['require', 'prefer', 'verify-ca']) {
      expect(connectionOptions(`${NEON}?channel_binding=prefer&sslmode=${mode}`)).toEqual({
        connectionString: `${NEON}?channel_binding=prefer&sslmode=verify-full`,
        enableChannelBinding: true,
      });
    }
  });

  it('leaves other URLs alone', () => {
    for (const url of [
      'postgres://fitai:fitai_dev_password@127.0.0.1:5432/fitai',
      `${NEON}?sslmode=verify-full`,
      `${NEON}?sslmode=disable`,
      `${NEON}?sslmode=no-verify`,
      `${NEON}?uselibpqcompat=true&sslmode=require`,
      'postgresql://u:require@db.example.com/sslmode_require?application_name=sslmode=require',
    ]) {
      expect(connectionOptions(url)).toEqual({ connectionString: url, enableChannelBinding: false });
    }
    expect(connectionOptions(`${NEON}?channel_binding=disable`).enableChannelBinding).toBe(false);
  });
});

describe('isTransactionPoolerUrl', () => {
  it('recognises Neon’s pooled host name only', () => {
    expect(isTransactionPoolerUrl('postgresql://u:p@ep-cool-darkness-123456-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require')).toBe(true);
    expect(isTransactionPoolerUrl(`${NEON}?sslmode=require`)).toBe(false);
    expect(isTransactionPoolerUrl('postgresql://u:p@dpg-abc123-a.frankfurt-postgres.render.com/app')).toBe(false);
    expect(isTransactionPoolerUrl('not a url')).toBe(false);
  });
});
