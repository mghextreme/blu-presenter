do $$
declare existingOrgId bigint;
begin
  select id
  from public.organizations
  limit 1
  into existingOrgId;

  insert into public.songs (title, "orgId", artist, blocks)
  values (
    'How Great Is Our God',
    existingOrgId,
    'Chris Tomlin',
    '[
      {
        "text": "The splendor of a King\nclothed in majesty\nLet all the Earth rejoice\nAll the Earth rejoice"
      },
      {
        "text": "He wraps himself in light\nAnd darkness tries to hide\nAnd trembles at His voice\nTrembles at His voice"
      },
      {
        "text": "How great is our God, sing with me\nHow great is our God, and all will see\nHow great, how great is our God"
      },
      {
        "text": ""
      },
      {
        "text": "Age to age He stands\nAnd time is in His hands\nBeginning and the end\nBeginning and the end"
      },
      {
        "text": "The Godhead Three in One\nFather, Spirit, Son\nThe Lion and the Lamb\nThe Lion and the Lamb"
      },
      {
        "text": "How great is our God, sing with me\nHow great is our God, and all will see\nHow great, how great is our God"
      },
      {
        "text": "Name above all names\nWorthy of our praise\nMy heart will sing\nHow great is our God"
      },
      {
        "text": "Name above all names\nWorthy of our praise\nMy heart will sing\nHow great is our God"
      },
      {
        "text": "How great is our God, sing with me\nHow great is our God, and all will see\nHow great, how great is our God"
      },
      {
        "text": "How great is our God, sing with me\nHow great is our God, and all will see\nHow great, how great is our God"
      },
      {
        "text": "How great is our God, sing with me\nHow great is our God, and all will see\nHow great, how great is our God"
      }
    ]'
  );
end $$;
