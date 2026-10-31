-- A mastered review card stays (flagged) so the other phone does not bring it back.
alter table public.deck_cards add column mastered boolean not null default false;
