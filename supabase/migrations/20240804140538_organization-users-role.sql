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
  insert into public.users ("authId")
  values (new.id)
  returning id into new_user_id;

  insert into public.organizations ("ownerId")
  values (new_user_id)
  returning id into new_org_id;

  insert into public.organization_users ("orgId", "userId", "role")
  values (new_org_id, new_user_id, 'owner');

  update auth.users
  set
    raw_user_meta_data = jsonb_set(
      raw_user_meta_data::jsonb,
      '{orgs}'::text[],
      '[]'::jsonb || concat('[', new_org_id, ']')::jsonb,
      true
    )::jsonb
  where id = new.id;

  return new;
end;
$$;
