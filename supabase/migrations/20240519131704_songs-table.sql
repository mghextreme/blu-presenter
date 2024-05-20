CREATE TABLE IF NOT EXISTS public.songs (
  "id" serial PRIMARY KEY,
  "title" varchar(255),
  "artist" varchar(255)
);

CREATE POLICY "songs_policy"
ON public.songs
AS PERMISSIVE FOR ALL
TO authenticated
WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.songParts (
  "id" serial PRIMARY KEY,
  "songId" integer REFERENCES songs,
  "text" varchar(255),
  "order" smallserial
);

CREATE POLICY "songparts_policy"
ON public.songparts
AS PERMISSIVE FOR ALL
TO authenticated
WITH CHECK (true);
