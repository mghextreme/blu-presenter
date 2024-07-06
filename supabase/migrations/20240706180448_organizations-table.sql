create table if not exists public.organizations (
  "id" serial primary key,
  "owner_id" integer,
  "name" varchar(255)
);

create table if not exists public.organization_users (
  "org_id" integer,
  "user_id" integer,
  constraint organization_users_pkey primary key (org_id, user_id)
);
