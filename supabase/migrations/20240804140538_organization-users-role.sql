alter table public.organization_users
add column "role" varchar(20) not null default 'admin';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  new_user_id integer;
  new_org_id integer;
begin
  insert into public.users ("authId", "email")
  values (new.id, new.email)
  returning id into new_user_id;

  insert into public.organizations ("ownerId")
  values (new_user_id)
  returning id into new_org_id;

  insert into public.organization_users ("orgId", "userId", "role")
  values (new_org_id, new_user_id, 'owner');
  

  return new;
end;
$$;
