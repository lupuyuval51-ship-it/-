-- Keep the real finish time so results (duration) look the same on every phone.
alter table public.sessions add column finished_at timestamptz;
