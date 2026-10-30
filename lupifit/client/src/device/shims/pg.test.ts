/**
 * The PGlite-backed pg shim: node-postgres result shapes, the server's type parsers, error codes,
 * transactions and the two lease modes. Expected values are what node-postgres returns for the same
 * queries with server/src/db/pool.ts's parsers (TimeZone UTC).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import pg, { Pool, closeDeviceDatabase, configureDeviceDatabase, dataDirFor, deviceDatabase, deviceDatabaseStats, type QueryResult } from './pg';

const DATA_DIR = 'memory://pg-shim-test';
let pool: Pool;

beforeAll(async () => {
  pool = new Pool({ connectionString: DATA_DIR });
  await pool.query(`
    CREATE TABLE parent (id serial PRIMARY KEY, name text UNIQUE NOT NULL, qty int CHECK (qty >= 0));
    CREATE TABLE child (id serial PRIMARY KEY, parent_id int NOT NULL REFERENCES parent(id));
    CREATE TABLE kv (k text PRIMARY KEY, v int NOT NULL);
  `);
});
afterAll(async () => {
  await pool.end();
  await closeDeviceDatabase(DATA_DIR);
});

const TYPES_SQL = `SELECT 12.50::numeric AS num, 9007199254740::int8 AS big, count(*) AS cnt, '2026-03-27'::date AS d,
  '2026-03-27 10:15:30.25+03'::timestamptz AS ts, '{"a":[1,2.5,"x"],"b":null}'::jsonb AS j, '{"k":1}'::json AS js,
  ARRAY['chest','back']::text[] AS tags, ARRAY[1,2,3]::int[] AS ints, ARRAY[1.5,2]::numeric[] AS nums,
  'a2b9c6d0-1e2f-4a5b-8c7d-9e0f1a2b3c4d'::uuid AS id, true AS flag, 1.25::float8 AS f, 7::int2 AS small,
  NULL::numeric AS nnum, NULL::date AS nd, NULL::int8 AS nbig, 'שלום'::text AS he
  FROM (VALUES (1), (2)) v(x)`;

describe('type parsers', () => {
  it('without registered parsers: BIGINT is a string (node-postgres default), NUMERIC a string', async () => {
    const { rows } = await pool.query("SELECT 5::int8 AS big, 1.5::numeric AS num, $1::text AS t", ['x']);
    expect(rows[0]).toEqual({ big: '5', num: '1.5', t: 'x' });
  });

  it('applies the parsers server/src/db/pool.ts registers, also inside arrays', async () => {
    pg.types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));
    pg.types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)));
    pg.types.setTypeParser(1082, (v) => v);
    for (const params of [undefined, ['unused']]) {
      // Both protocols: parameterless queries use PGlite exec (simple protocol), others query (extended).
      const sql = params ? TYPES_SQL.replace('FROM', ', $1::text AS p FROM') : TYPES_SQL;
      const { rows } = await pool.query(sql, params);
      const r = rows[0]!;
      expect(r.num).toBe(12.5);
      expect(r.big).toBe(9007199254740);
      expect(r.cnt).toBe(2);
      expect(r.d).toBe('2026-03-27');
      expect(r.ts).toBeInstanceOf(Date);
      expect((r.ts as Date).toISOString()).toBe('2026-03-27T07:15:30.250Z');
      expect(r.j).toEqual({ a: [1, 2.5, 'x'], b: null });
      expect(r.js).toEqual({ k: 1 });
      expect(r.tags).toEqual(['chest', 'back']);
      expect(r.ints).toEqual([1, 2, 3]);
      expect(r.nums).toEqual([1.5, 2]); // node-postgres parses numeric[] as numbers as well
      expect(r.id).toBe('a2b9c6d0-1e2f-4a5b-8c7d-9e0f1a2b3c4d');
      expect(r.flag).toBe(true);
      expect(r.f).toBe(1.25);
      expect(r.small).toBe(7);
      expect([r.nnum, r.nd, r.nbig]).toEqual([null, null, null]);
      expect(r.he).toBe('שלום');
    }
    expect(pg.types.getTypeParser(1082)('2026-01-02')).toBe('2026-01-02');
  });

  it('serializes parameters like node-postgres (arrays with NULLs, dates, booleans, JSON text)', async () => {
    const { rows } = await pool.query(
      `SELECT $1::uuid[] AS ids, $2::int[] AS ints, $3::numeric[] AS nums, $4::timestamptz AS at, $5::boolean AS b, $6::jsonb AS j,
              ($7 || ' minutes')::interval = interval '15 minutes' AS iv, $8::date AS d`,
      [
        ['a2b9c6d0-1e2f-4a5b-8c7d-9e0f1a2b3c4d'],
        [1, null, 3],
        [1.5, null],
        new Date('2026-03-27T07:15:30.250Z'),
        false,
        JSON.stringify({ x: [1] }),
        '15',
        '2026-12-31',
      ],
    );
    expect(rows[0]).toEqual({
      ids: ['a2b9c6d0-1e2f-4a5b-8c7d-9e0f1a2b3c4d'],
      ints: [1, null, 3],
      nums: [1.5, null],
      at: new Date('2026-03-27T07:15:30.250Z'),
      b: false,
      j: { x: [1] },
      iv: true,
      d: '2026-12-31',
    });
  });

  it('reads timestamp without time zone as UTC and converts time zones like the server database', async () => {
    const { rows } = await pool.query(
      "SELECT ('2026-03-27 01:00'::timestamp AT TIME ZONE 'Asia/Jerusalem') AS il, ('2026-06-01 12:00:00+00'::timestamptz AT TIME ZONE 'Asia/Jerusalem')::date AS d, current_setting('TimeZone') AS tz",
    );
    expect((rows[0]!.il as Date).toISOString()).toBe('2026-03-26T23:00:00.000Z');
    expect(rows[0]!.d).toBe('2026-06-01');
    expect(rows[0]!.tz).toBe('UTC');
  });
});

describe('results', () => {
  it('reports rowCount like node-postgres', async () => {
    const ins = await pool.query('INSERT INTO kv (k, v) VALUES ($1, 1), ($2, 2) RETURNING k', ['a', 'b']);
    expect([ins.command, ins.rowCount, ins.rows]).toEqual(['INSERT', 2, [{ k: 'a' }, { k: 'b' }]]);
    const none = await pool.query('INSERT INTO kv (k, v) VALUES ($1, 9) ON CONFLICT (k) DO NOTHING RETURNING k', ['a']);
    expect([none.rowCount, none.rows]).toEqual([0, []]);
    const sel = await pool.query('SELECT k FROM kv WHERE v > $1 ORDER BY k', [0]);
    expect([sel.command, sel.rowCount]).toEqual(['SELECT', 2]);
    const upd = await pool.query('UPDATE kv SET v = v + 1 WHERE k = ANY($1::text[])', [['a', 'b', 'zz']]);
    expect([upd.command, upd.rowCount, upd.rows]).toEqual(['UPDATE', 2, []]);
    const miss = await pool.query('UPDATE kv SET v = 0 WHERE k = $1', ['zz']);
    expect(miss.rowCount).toBe(0);
    const del = await pool.query('DELETE FROM kv WHERE k = $1', ['b']);
    expect([del.command, del.rowCount]).toEqual(['DELETE', 1]);
    const ddl = await pool.query('CREATE TEMP TABLE t_ddl (x int)');
    expect([ddl.command, ddl.rowCount]).toEqual(['CREATE', null]);
    expect(sel.fields).toEqual([{ name: 'k', dataTypeID: 25 }]);
  });

  it('runs a parameterless multi-statement text with the simple protocol and returns one result per statement', async () => {
    const results = (await pool.query("SELECT 1 AS one; UPDATE kv SET v = v WHERE k = 'a'; SELECT 'x' AS two")) as unknown as QueryResult[];
    expect(Array.isArray(results)).toBe(true);
    expect(results.map((r) => [r.command, r.rowCount])).toEqual([
      ['SELECT', 1],
      ['UPDATE', 1],
      ['SELECT', 1],
    ]);
    expect(results[2]!.rows).toEqual([{ two: 'x' }]);
    const single = await pool.query('SELECT 2 AS two');
    expect(single.rows).toEqual([{ two: 2 }]);
  });

  it('accepts query config objects', async () => {
    const r = await pool.query({ text: 'SELECT $1::int + 1 AS n', values: [41] });
    expect(r.rows).toEqual([{ n: 42 }]);
  });
});

describe('errors', () => {
  const codeOf = async (p: Promise<unknown>) => {
    try {
      await p;
    } catch (err) {
      return err as Record<string, unknown>;
    }
    throw new Error('expected an error');
  };

  it('keeps node-postgres error fields and codes the error middleware maps', async () => {
    await pool.query('INSERT INTO parent (name, qty) VALUES ($1, 1)', ['dup']);
    const unique = await codeOf(pool.query('INSERT INTO parent (name, qty) VALUES ($1, 1)', ['dup']));
    expect(unique).toBeInstanceOf(Error);
    expect(unique).toMatchObject({ code: '23505', constraint: 'parent_name_key', table: 'parent', severity: 'ERROR' });
    expect(unique.detail).toMatch(/already exists/);
    // node-postgres errors carry no query parameters; neither do the shim's.
    expect(unique).not.toHaveProperty('params');
    expect(unique).not.toHaveProperty('query');
    expect(await codeOf(pool.query('INSERT INTO child (parent_id) VALUES ($1)', [999]))).toMatchObject({ code: '23503' });
    expect(await codeOf(pool.query('INSERT INTO parent (name, qty) VALUES ($1, -1)', ['neg']))).toMatchObject({ code: '23514' });
    expect(await codeOf(pool.query('INSERT INTO parent (name) VALUES (NULL)'))).toMatchObject({ code: '23502' });
    expect(await codeOf(pool.query('SELECT $1::uuid', ['not-a-uuid']))).toMatchObject({ code: '22P02' });
    expect(await codeOf(pool.query('SELECT * FROM no_such_table'))).toMatchObject({ code: '42P01' });
    expect(await codeOf(pool.query('SAVEPOINT outside_tx'))).toMatchObject({ code: '25P01' });
  });
});

describe('transactions on a client', () => {
  it('commits, rolls back, and keeps an aborted transaction until ROLLBACK', async () => {
    const c = await pool.connect();
    await c.query('BEGIN');
    await c.query('INSERT INTO kv (k, v) VALUES ($1, 1)', ['tx-commit']);
    await c.query('COMMIT');
    await c.query('BEGIN');
    await c.query('INSERT INTO kv (k, v) VALUES ($1, 1)', ['tx-rollback']);
    await c.query('ROLLBACK');
    await c.query('BEGIN');
    await expect(c.query('INSERT INTO kv (k, v) VALUES ($1, 1)', ['tx-commit'])).rejects.toMatchObject({ code: '23505' });
    await expect(c.query('SELECT 1')).rejects.toMatchObject({ code: '25P02' }); // current transaction is aborted
    await c.query('ROLLBACK');
    c.release();
    const { rows } = await pool.query("SELECT k FROM kv WHERE k LIKE 'tx-%' ORDER BY k");
    expect(rows).toEqual([{ k: 'tx-commit' }]);
  });

  it('supports savepoints inside a transaction (gamification hooks use them)', async () => {
    const c = await pool.connect();
    await c.query('BEGIN');
    await c.query('INSERT INTO kv (k, v) VALUES ($1, 1)', ['sp-keep']);
    await c.query('SAVEPOINT hook');
    await c.query('INSERT INTO kv (k, v) VALUES ($1, 1)', ['sp-drop']);
    await c.query('ROLLBACK TO SAVEPOINT hook');
    await c.query('RELEASE SAVEPOINT hook');
    await c.query('COMMIT');
    c.release();
    const { rows } = await pool.query("SELECT k FROM kv WHERE k LIKE 'sp-%'");
    expect(rows).toEqual([{ k: 'sp-keep' }]);
  });

  it('does not flush storage inside a transaction, and flushes once after COMMIT', async () => {
    const db = await deviceDatabase(DATA_DIR);
    const c = await pool.connect();
    await c.query('BEGIN');
    const sync = vi.spyOn(db, 'syncToFs');
    await c.query('INSERT INTO kv (k, v) VALUES ($1, 1)', ['durable']);
    await c.query('UPDATE kv SET v = 2 WHERE k = $1', ['durable']);
    expect(sync).not.toHaveBeenCalled();
    await c.query('COMMIT');
    expect(sync).toHaveBeenCalledTimes(1);
    c.release();
    sync.mockRestore();
  });

  it('rolls back a transaction left open when the client is released, and refuses a second release', async () => {
    const c = await pool.connect();
    await c.query('BEGIN');
    await c.query('INSERT INTO kv (k, v) VALUES ($1, 1)', ['left-open']);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    c.release();
    expect(() => c.release()).toThrow(/already been released/);
    await expect(c.query('SELECT 1')).rejects.toThrow(/not queryable/);
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM kv WHERE k = $1', ['left-open']);
    expect(rows[0]!.n).toBe(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('uses advisory locks like the migration runner', async () => {
    const c = await pool.connect();
    await c.query('SELECT pg_advisory_lock($1)', [74_617_201]);
    const { rows } = await c.query('SELECT pg_advisory_unlock($1) AS ok', [74_617_201]);
    expect(rows[0]!.ok).toBe(true);
    c.release();
  });
});

describe('lease modes (one PGlite connection)', () => {
  it('exclusive: clients and pool queries take turns, so concurrent transactions never mix', async () => {
    configureDeviceDatabase({ leaseMode: 'exclusive' });
    try {
      const order: string[] = [];
      const first = await pool.connect();
      await first.query('BEGIN');
      await first.query('INSERT INTO kv (k, v) VALUES ($1, 1)', ['ex-first']);
      const second = pool.connect().then(async (c) => {
        order.push('second got the connection');
        // The first transaction committed before this one could start: it sees the row.
        const { rows } = await c.query('SELECT count(*)::int AS n FROM kv WHERE k = $1', ['ex-first']);
        c.release();
        return rows[0]!.n;
      });
      const outside = pool.query('SELECT count(*)::int AS n FROM kv WHERE k = $1', ['ex-first']).then((r) => {
        order.push('pool query ran');
        return r.rows[0]!.n;
      });
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(order).toEqual([]);
      order.push('first commits');
      await first.query('COMMIT');
      first.release();
      expect(await second).toBe(1);
      expect(await outside).toBe(1);
      expect(order).toEqual(['first commits', 'second got the connection', 'pool query ran']);
    } finally {
      configureDeviceDatabase({ leaseMode: 'shared' });
    }
  });

  it('shared: a pool query made while a client is checked out runs inside its transaction (counted)', async () => {
    const before = deviceDatabaseStats(DATA_DIR);
    const c = await pool.connect();
    await c.query('BEGIN');
    await c.query('INSERT INTO kv (k, v) VALUES ($1, 1)', ['sh-uncommitted']);
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM kv WHERE k = $1', ['sh-uncommitted']);
    expect(rows[0]!.n).toBe(1);
    await c.query('ROLLBACK');
    c.release();
    const after = deviceDatabaseStats(DATA_DIR);
    expect(after.nestedQueries - before.nestedQueries).toBe(1);
    expect(after.transactions - before.transactions).toBe(1);
  });

  it('shared: a transaction opened inside another one becomes a savepoint', async () => {
    const before = deviceDatabaseStats(DATA_DIR);
    const outer = await pool.connect();
    await outer.query('BEGIN');
    await outer.query('INSERT INTO kv (k, v) VALUES ($1, 1)', ['nest-outer']);
    const inner = await pool.connect();
    expect(inner.nested).toBe(true);
    await inner.query('BEGIN');
    await inner.query('INSERT INTO kv (k, v) VALUES ($1, 1)', ['nest-inner-rolled-back']);
    await inner.query('ROLLBACK');
    inner.release();
    const again = await pool.connect();
    await again.query('BEGIN');
    await again.query('INSERT INTO kv (k, v) VALUES ($1, 1)', ['nest-inner-kept']);
    await again.query('COMMIT');
    again.release();
    await outer.query('COMMIT');
    outer.release();
    const { rows } = await pool.query("SELECT k FROM kv WHERE k LIKE 'nest-%' ORDER BY k");
    expect(rows).toEqual([{ k: 'nest-inner-kept' }, { k: 'nest-outer' }]);
    expect(deviceDatabaseStats(DATA_DIR).nestedClients - before.nestedClients).toBe(2);
  });
});

describe('pools and data directories', () => {
  it('keeps the database open after pool.end(): a new pool on the same data directory sees the data', async () => {
    const other = new Pool({ connectionString: DATA_DIR });
    await other.query('INSERT INTO kv (k, v) VALUES ($1, 1)', ['survives-end']);
    await other.end();
    await expect(other.query('SELECT 1')).rejects.toThrow(/after calling end/);
    const third = new Pool({ connectionString: DATA_DIR });
    const { rows } = await third.query('SELECT v FROM kv WHERE k = $1', ['survives-end']);
    expect(rows).toEqual([{ v: 1 }]);
    expect(third.on('error', () => undefined)).toBe(third);
  });

  it('accepts PGlite data directories only', () => {
    expect(dataDirFor('idb://lupufit-device')).toBe('idb://lupufit-device');
    expect(dataDirFor('memory://')).toBe('memory://');
    expect(dataDirFor('opfs-ahp://lupufit')).toBe('opfs-ahp://lupufit');
    expect(() => dataDirFor('postgres://fitai:secret@127.0.0.1/fitai')).toThrow(/DATABASE_URL must be idb:/);
    expect(() => dataDirFor('')).toThrow();
  });

  it('gives clock_timestamp() strictly increasing values although PGlite’s clock has millisecond resolution', async () => {
    const c = await pool.connect();
    await c.query('BEGIN');
    await c.query('CREATE TABLE clock_order (n int, at timestamptz)');
    for (let n = 0; n < 40; n++) await c.query('INSERT INTO clock_order (n, at) VALUES ($1, clock_timestamp())', [n]);
    await c.query('COMMIT');
    c.release();
    const { rows } = await pool.query('SELECT n FROM clock_order ORDER BY at');
    expect(rows.map((r) => r.n)).toEqual(Array.from({ length: 40 }, (_, n) => n));
    const distinct = await pool.query('SELECT count(DISTINCT at)::int AS n FROM clock_order');
    expect(distinct.rows[0]!.n).toBe(40);
    // Still the real time: within a second of now().
    const drift = await pool.query('SELECT abs(extract(epoch FROM clock_timestamp() - now()))::float8 < 1 AS ok');
    expect(drift.rows[0]!.ok).toBe(true);
    // The catalog function is still there for code that names it.
    const catalog = await pool.query("SELECT pg_catalog.clock_timestamp() IS NOT NULL AS ok, current_setting('search_path') AS path");
    expect(catalog.rows[0]).toEqual({ ok: true, path: '"$user", public, pg_catalog' });
  });

  it('has the pg_trgm extension available (exercise and food search)', async () => {
    await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    const { rows } = await pool.query('SELECT similarity($1, $2) > 0.3 AS close', ['chicken breast', 'chiken brest']);
    expect(rows[0]!.close).toBe(true);
  });
});
