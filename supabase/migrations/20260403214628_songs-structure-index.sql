CREATE OR REPLACE FUNCTION get_song_tsvector(title TEXT, artist TEXT, blocks JSON, lang_code CHAR(2))
RETURNS tsvector AS $$
DECLARE
    lyrics TEXT;
    language_name TEXT;
    title_vector tsvector;
    artist_vector tsvector;
    lyrics_vector tsvector;
BEGIN
    SELECT string_agg(line->>'content', E'\n') INTO lyrics
    FROM json_array_elements(COALESCE(blocks, '[]'::json)) AS block,
         json_array_elements(COALESCE(block->'lines', '[]'::json)) AS line
    WHERE line->>'type' = 'lyrics';

    language_name := get_language_name(lang_code);

    title_vector := get_combined_tsvector(COALESCE(title, ''), language_name);
    artist_vector := get_combined_tsvector(COALESCE(artist, ''), language_name);
    lyrics_vector := get_combined_tsvector(COALESCE(lyrics, ''), language_name);

    RETURN setweight(title_vector, 'A') || ' ' ||
           setweight(artist_vector, 'B') || ' ' ||
           setweight(lyrics_vector, 'D');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Force regeneration of the stored generated column
UPDATE songs SET title = title;
