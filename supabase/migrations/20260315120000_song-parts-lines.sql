-- Migrate song blocks from {text, chords} to {lines: [{type, content}]}
-- For each block, split text and chords by newline, then interleave:
--   chord line i, then lyrics line i, for each index i.

UPDATE songs
SET blocks = (
  SELECT COALESCE(json_agg(new_block ORDER BY block_index), '[]'::json)
  FROM (
    SELECT
      block_index,
      json_build_object(
        'lines',
        (
          SELECT COALESCE(json_agg(line_obj ORDER BY line_ord), '[]'::json)
          FROM (
            -- Generate interleaved chord + lyrics lines
            SELECT line_obj, line_ord
            FROM (
              SELECT
                json_build_object('type', 'chords', 'content', chord_line) AS line_obj,
                (i * 2) AS line_ord
              FROM unnest(
                string_to_array(
                  replace(COALESCE(NULLIF(block_elem->>'chords', ''), NULL), '\n', E'\n'),
                  E'\n'
                )
              ) WITH ORDINALITY AS c(chord_line, i)
              WHERE block_elem->>'chords' IS NOT NULL
                AND block_elem->>'chords' != ''

              UNION ALL

              SELECT
                json_build_object('type', 'lyrics', 'content', lyrics_line) AS line_obj,
                (i * 2 + 1) AS line_ord
              FROM unnest(
                string_to_array(
                  replace(COALESCE(NULLIF(block_elem->>'text', ''), NULL), '\n', E'\n'),
                  E'\n'
                )
              ) WITH ORDINALITY AS l(lyrics_line, i)
              WHERE block_elem->>'text' IS NOT NULL
                AND block_elem->>'text' != ''
            ) all_lines
          ) ordered_lines
        )
      ) AS new_block
    FROM json_array_elements(blocks) WITH ORDINALITY AS b(block_elem, block_index)
  ) transformed_blocks
)
WHERE json_array_length(blocks) > 0;
