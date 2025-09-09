CREATE OR REPLACE FUNCTION get_language_name(lang_code TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE LOWER(lang_code)
        WHEN 'en' THEN 'english'
        WHEN 'pt' THEN 'portuguese'
        WHEN 'es' THEN 'spanish'
        WHEN 'fr' THEN 'french'
        WHEN 'de' THEN 'german'
        WHEN 'it' THEN 'italian'
        WHEN 'ar' THEN 'arabic'
        WHEN 'ca' THEN 'catalan'
        WHEN 'da' THEN 'danish'
        WHEN 'el' THEN 'greek'
        WHEN 'eu' THEN 'basque'
        WHEN 'fi' THEN 'finnish'
        WHEN 'ga' THEN 'irish'
        WHEN 'hi' THEN 'hindi'
        WHEN 'hu' THEN 'hungarian'
        WHEN 'hy' THEN 'armenian'
        WHEN 'id' THEN 'indonesian'
        WHEN 'lt' THEN 'lithuanian'
        WHEN 'ne' THEN 'nepali'
        WHEN 'nl' THEN 'dutch'
        WHEN 'no' THEN 'norwegian'
        WHEN 'ro' THEN 'romanian'
        WHEN 'ru' THEN 'russian'
        WHEN 'sr' THEN 'serbian'
        WHEN 'sv' THEN 'swedish'
        WHEN 'ta' THEN 'tamil'
        WHEN 'tr' THEN 'turkish'
        WHEN 'yi' THEN 'yiddish'
        ELSE NULL
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_combined_tsvector(content TEXT, language_name TEXT)
RETURNS tsvector AS $$
DECLARE
    combined_vector tsvector;
BEGIN
    combined_vector := to_tsvector('simple', content);
    IF language_name IS NOT NULL THEN
        combined_vector := combined_vector || ' ' || to_tsvector(language_name::regconfig, content);
    END IF;
    RETURN combined_vector;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_combined_tsvector_code(content TEXT, lang_code CHAR(2))
RETURNS tsvector AS $$
DECLARE
    language_name TEXT;
BEGIN
    language_name := get_language_name(lang_code);
    RETURN get_combined_tsvector(content, language_name);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_song_tsvector(title TEXT, artist TEXT, blocks JSON, lang_code CHAR(2))
RETURNS tsvector AS $$
DECLARE
    lyrics TEXT;
    language_name TEXT;
    title_vector tsvector;
    artist_vector tsvector;
    lyrics_vector tsvector;
BEGIN
    SELECT string_agg(block->>'text', E'\n') INTO lyrics
    FROM json_array_elements(COALESCE(blocks, '[]'::json)) as block;

    language_name := get_language_name(lang_code);

    title_vector := get_combined_tsvector(COALESCE(title, ''), language_name);
    artist_vector := get_combined_tsvector(COALESCE(artist, ''), language_name);
    lyrics_vector := get_combined_tsvector(COALESCE(lyrics, ''), language_name);

    RETURN setweight(title_vector, 'A') || ' ' ||
           setweight(artist_vector, 'B') || ' ' ||
           setweight(lyrics_vector, 'D');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_combined_tsquery(content TEXT, language_name TEXT)
RETURNS tsquery AS $$
DECLARE
    combined_vector tsquery;
BEGIN
    combined_vector := plainto_tsquery('simple', content);
    IF language_name IS NOT NULL THEN
        combined_vector := combined_vector || ' ' || plainto_tsquery(language_name::regconfig, content);
    END IF;
    RETURN combined_vector;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_combined_tsquery_code(content TEXT, lang_code CHAR(2))
RETURNS tsquery AS $$
DECLARE
    language_name TEXT;
BEGIN
    language_name := get_language_name(lang_code);
    RETURN get_combined_tsquery(content, language_name);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

ALTER TABLE songs ADD searchVector tsvector GENERATED ALWAYS AS (
  get_song_tsvector("title", "artist", "blocks", "language")
) STORED;

CREATE INDEX idx_search ON songs USING GIN(searchVector);
