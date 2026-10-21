-- Trigram-based typo tolerance for song search, over title + artist only.
-- The trigram index is additive: exact/prefix matches keep using searchVector,
-- while misspelled queries can still surface songs through similarity().

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION get_song_search_text(title TEXT, artist TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN unaccent(lower(COALESCE(title, ''))) || ' ' || unaccent(lower(COALESCE(artist, '')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

ALTER TABLE songs ADD searchText TEXT GENERATED ALWAYS AS (
  get_song_search_text("title", "artist")
) STORED;

CREATE INDEX idx_search_text ON songs USING gin(searchText gin_trgm_ops);

-- Lower the word-similarity threshold so transposed-letter typos ("amzaing"
-- -> word_similarity ~0.33 vs "amazing") still match. Applies to new
-- connections; trigram noise is bounded by the AND-per-token query shape
-- and result ranking.
-- The pg_trgm GUCs are only registered after the library is loaded, so touch
-- the extension first or ALTER DATABASE fails on non-superusers.
DO $$ BEGIN PERFORM similarity('a', 'a'); END $$;
ALTER DATABASE postgres SET pg_trgm.word_similarity_threshold = 0.3;
