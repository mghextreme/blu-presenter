do $$
declare existingOrgId bigint;
begin
  select id
  from public.organizations
  limit 1
  into existingOrgId;

  insert into public.songs (title, "orgId", artist, blocks)
  values (
    'Oceans (Where Feet May Fail)',
    existingOrgId,
    'Hillsong United',
    '[
      {
        "text": "You call me out upon the waters\nThe great unknown where feet may fail\nAnd there I find You in the mystery\nIn oceans deep my faith will stand"
      },
      {
        "text": "And I will call upon Your Name\nAnd keep my eyes above the waves\nWhen oceans rise\nMy soul will rest in Your embrace\nFor I am Yours and You are mine"
      },
      {
        "text": "Your grace abounds in deepest waters\nYour sovereign hand will be my guide\nWhere feet may fail and fear surrounds me\nYou''ve never failed and You won''t start now"
      },
      {
        "text": "And I will call upon Your Name\nAnd keep my eyes above the waves\nWhen oceans rise\nMy soul will rest in Your embrace\nFor I am Yours and You are mine"
      },
      {
        "text": ""
      },
      {
        "text": "Spirit lead me where my trust is without borders\nLet me walk upon the waters\nWherever You would call me"
      },
      {
        "text": "Take me deeper than my feet could ever wander\nAnd my faith will be made stronger\nIn the presence of my Saviour"
      },
      {
        "text": "Spirit lead me where my trust is without borders\nLet me walk upon the waters\nWherever You would call me"
      },
      {
        "text": "Take me deeper than my feet could ever wander\nAnd my faith will be made stronger\nIn the presence of my Saviour"
      },
      {
        "text": "Spirit lead me where my trust is without borders\nLet me walk upon the waters\nWherever You would call me"
      },
      {
        "text": "Take me deeper than my feet could ever wander\nAnd my faith will be made stronger\nIn the presence of my Saviour"
      },
      {
        "text": "Spirit lead me where my trust is without borders\nLet me walk upon the waters\nWherever You would call me"
      },
      {
        "text": "Take me deeper than my feet could ever wander\nAnd my faith will be made stronger\nIn the presence of my Saviour"
      },
      {
        "text": "And I will call upon Your Name\nAnd keep my eyes above the waves\nWhen oceans rise\nMy soul will rest in Your embrace\nFor I am Yours and You are mine"
      }
    ]'
  );
end $$;
