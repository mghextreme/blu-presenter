create table if not exists public.organization_invitations (
  "id" serial PRIMARY KEY,
  "orgId" integer not null references public.organizations (id),
  "email" varchar(255) not null,
  "inviterId" integer not null references public.users (id),
  "role" varchar(20) not null,
  "secret" varchar(511) not null,
  constraint organization_invitations_uniquekey unique ("orgId", "email")
);
