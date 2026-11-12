-- Schedule-level references (same shape as song references), used e.g. for
-- auto-generated Spotify playlists attached to a schedule.
alter table public.schedules
add column "references" json not null default '[]';

-- Spotify integration credentials, stored server-side only (never sent to
-- clients; the entity column is select:false). One jsonb column per
-- integration: add e.g. "youtube" jsonb when a new integration arrives.
alter table public.users
add column "spotify" jsonb null;
