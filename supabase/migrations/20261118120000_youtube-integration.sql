-- YouTube integration credentials, stored server-side only (never sent to
-- clients; the entity column is select:false). Same shape as
-- users."spotify": the OAuth tokens plus the "enabled" flag (set manually)
-- that grants playlist access; the API preserves the flag when the user
-- connects or disconnects.
alter table public.users
add column "youtube" jsonb null;
