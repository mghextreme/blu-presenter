-- inserts a row into public.profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  new_user_id integer;
  new_org_id integer;
begin
  insert into public.users (auth_id)
  values (new.id)
  returning id into new_user_id;

  insert into public.organizations (owner_id)
  values (new_user_id)
  returning id into new_org_id;

  insert into public.organization_users (org_id, user_id)
  values (new_org_id, new_user_id);

  return new;
end;
$$;

-- trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
