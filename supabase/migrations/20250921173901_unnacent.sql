CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION get_combined_tsvector(content TEXT, language_name TEXT)
RETURNS tsvector AS $$
DECLARE
    simplified text;
    combined_vector tsvector;
BEGIN
    simplified := unaccent(content);
    combined_vector := to_tsvector('simple', simplified);
    IF language_name IS NOT NULL THEN
        combined_vector := combined_vector || ' ' || to_tsvector(language_name::regconfig, simplified);
    END IF;
    RETURN combined_vector;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_combined_tsquery(content TEXT, language_name TEXT)
RETURNS tsquery AS $$
DECLARE
    simplified text;
    combined_vector tsquery;
BEGIN
    simplified := unaccent(content);
    combined_vector := plainto_tsquery('simple', simplified);
    IF language_name IS NOT NULL THEN
        combined_vector := combined_vector || ' ' || plainto_tsquery(language_name::regconfig, simplified);
    END IF;
    RETURN combined_vector;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

UPDATE songs SET title = title;
