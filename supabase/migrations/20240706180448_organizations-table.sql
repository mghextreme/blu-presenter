create table if not exists public.organizations (
  "id" serial primary key,
  "ownerId" integer not null references public.users (id),
  "name" varchar(255)
);

create table if not exists public.organization_users (
  "orgId" integer not null references public.organizations (id),
  "userId" integer not null references public.users (id),
  constraint organization_users_pkey primary key ("orgId", "userId")
);
