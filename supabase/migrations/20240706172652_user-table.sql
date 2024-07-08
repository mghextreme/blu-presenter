create table if not exists public.users (
  "id" serial primary key,
  "authId" uuid not null references auth.users on delete cascade,
  "name" varchar(511),
  "nickname" varchar(40),
  unique ("authId")
);
