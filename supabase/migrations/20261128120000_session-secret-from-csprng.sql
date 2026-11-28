-- Default session secrets came from md5(random()), which is not a
-- cryptographic generator. Existing secrets are kept: they are in projector
-- URLs already in use.
create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.sessions ("orgId", "secret", "default")
  values (new.id, encode(extensions.gen_random_bytes(8), 'hex'), true);

  return new;
end;
$$;

-- Sessions created through the API had no secret, so receivers could never
-- join them.
update public.sessions
set "secret" = encode(extensions.gen_random_bytes(8), 'hex')
where "secret" is null;
