alter table public.songs
alter column "orgId" drop not null;

alter table public.songs
alter column "orgId" set default null;
