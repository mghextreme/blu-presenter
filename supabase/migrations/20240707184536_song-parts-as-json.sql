alter table public.songs
add column "blocks" json not null default '[]';

update songs
set blocks = parts.blocks
from (
  select "songId", json_agg("blocks") as "blocks"
  from (
    select "songId", json_build_object('text', text) as "blocks"
    from (
      select "songId", "text" from public.songparts
      order by "songId" asc, "order" asc
    ) sp
  ) sp2
  group by "songId"
) as parts
where parts."songId" = songs.id;

drop table songparts;
