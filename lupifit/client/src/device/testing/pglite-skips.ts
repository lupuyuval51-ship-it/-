/**
 * The only tests of server/tests that the PGlite harness (`npm run test:server:device`) skips, each with
 * the reason it cannot pass there. Keys: `<file relative to lupifit/> > <describe> > … > <test>`.
 * Everything else in the server suite must pass on PGlite.
 */
const SECOND_CONNECTION =
  'holds the reward lock in a second, concurrent database connection until the request is seen waiting for it in pg_locks; a PGlite database is a single connection, so the request can never get that far';

export const PGLITE_SKIPS: Readonly<Record<string, string>> = {
  'server/tests/idempotency.test.ts > Idempotency-Key with a client that aborts mid-request > replays the original result after the aborted request completes (the food is logged once)':
    SECOND_CONNECTION,
  'server/tests/idempotency.test.ts > Idempotency-Key with a client that aborts mid-request > answers 409 request_in_progress to a replay while the aborted request is still running, without running it again':
    SECOND_CONNECTION,
};
