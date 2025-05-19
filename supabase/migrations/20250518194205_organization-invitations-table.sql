create table if not exists public.organization_invitations (
  "orgId" integer not null references public.organizations (id),
  "email" varchar(255),
  "inviterId" integer not null references public.users (id),
  "role" varchar(20) not null,
  constraint organization_invitations_pkey primary key ("orgId", "email")
);
