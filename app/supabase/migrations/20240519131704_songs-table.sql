CREATE TABLE IF NOT EXISTS public.songs (
  "id" serial PRIMARY KEY,
  "title" varchar(255),
  "artist" varchar(255)
);

CREATE TABLE IF NOT EXISTS public.songParts (
  "id" serial PRIMARY KEY,
  "songId" integer REFERENCES songs,
  "text" varchar(255),
  "order" smallserial
);
