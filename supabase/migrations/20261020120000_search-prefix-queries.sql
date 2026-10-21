-- Prefix matching for song search: each token of the user query becomes a
-- prefix term (token:*), so partial words like "amaz" match "amazing".
-- Tokens shorter than 3 characters match exactly to avoid noisy prefixes.
-- Tokens are restricted to alphanumerics before reaching to_tsquery, so no
-- tsquery syntax can be injected through user input.

CREATE OR REPLACE FUNCTION get_prefix_tsquery(content TEXT, config TEXT)
RETURNS tsquery AS $$
DECLARE
    token TEXT;
    terms TEXT[] := '{}';
BEGIN
    FOR token IN
        SELECT t
        FROM unnest(regexp_split_to_array(content, '[^[:alnum:]]+')) AS t
        WHERE length(t) > 0
    LOOP
        IF length(token) >= 3 THEN
            terms := terms || (token || ':*');
        ELSE
            terms := terms || token;
        END IF;
    END LOOP;

    IF array_length(terms, 1) IS NULL THEN
        RETURN ''::tsquery;
    END IF;

    RETURN to_tsquery(config::regconfig, array_to_string(terms, ' & '));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_combined_tsquery(content TEXT, language_name TEXT)
RETURNS tsquery AS $$
DECLARE
    simplified TEXT;
    combined tsquery;
BEGIN
    simplified := unaccent(lower(content));
    combined := get_prefix_tsquery(simplified, 'simple');
    IF language_name IS NOT NULL THEN
        combined := combined || get_prefix_tsquery(simplified, language_name);
    END IF;
    RETURN combined;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
