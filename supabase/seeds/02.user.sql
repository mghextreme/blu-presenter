do $$
declare userId bigint;
begin
  select id
  from public.users
  limit 1
  into userId;

  update public.users
  set name = 'Admin', nickname = 'admin'
  where id = userId;
end $$;
