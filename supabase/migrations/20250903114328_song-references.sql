alter table public.songs
add column "createdAt" timestamp default CURRENT_TIMESTAMP(6);

alter table public.songs
add column "updatedAt" timestamp default CURRENT_TIMESTAMP(6);

alter table public.songs
add column "references" json not null default '[]';

alter table public.songs
add column "secret" varchar(32) null default null;
