CREATE TABLE IF NOT EXISTS public.sessions (
  "id" serial PRIMARY KEY,
  "name" varchar(255) null default null,
  "secret" varchar(255) null default null,
  "orgId" integer not null references public.organizations (id),
  "schedule" json not null default '[]',
  "scheduleItem" json not null default '{}',
  "selection" json not null default '{}',
  "updatedAt" timestamp default CURRENT_TIMESTAMP(6)
);

CREATE POLICY "sessions_policy"
ON public.sessions
AS PERMISSIVE FOR ALL
TO authenticated
WITH CHECK (true);

create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.sessions ("orgId", "secret")
  values (new.id, substr(md5(random()::text), 0, 17));

  return new;
end;
$$;

create trigger on_public_organization_created
  after insert on public.organizations
  for each row execute procedure public.handle_new_organization();

insert into public.sessions ("orgId", "secret")
select org.id, substr(md5(random()::text), 0, 17)
from public.organizations org;
