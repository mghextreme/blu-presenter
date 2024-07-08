alter table public.songs
add column "orgId" integer not null references public.organizations;
