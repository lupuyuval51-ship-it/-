-- Replay records of routes whose answers hold private text (coach chats and threads, the health profile, plans, photo estimates,
-- translations) no longer keep the answer: only the status is stored from now on. Drop the copies that older versions stored.
UPDATE idempotency_keys SET response_body = NULL
WHERE response_body IS NOT NULL
  AND (path LIKE '/api/coach/%' OR path LIKE '/api/plans%' OR path IN ('/api/profile', '/api/nutrition/photo-estimate', '/api/i18n/translate'));
