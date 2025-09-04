import { ReactNode } from "react";

export const alternateLyricsAndChords = (lyrics?: string, chords?: string): ReactNode => {

  const hasLyrics = (lyrics?.trim() ?? '').length > 0;
  const hasChords = (chords?.trim() ?? '').length > 0;

  if (!hasLyrics && !hasChords) {
    return null;
  }

  if (!hasChords) {
    return (
      <>{lyrics}</>
    );
  }

  if (!hasLyrics) {
    return (
      <b>{chords}</b>
    );
  }

  const lyricsLines = (lyrics ?? '').split(/\n/);
  const chordsLines = (chords ?? '').split(/\n/);
  const maxLines = Math.max(lyricsLines.length, chordsLines.length);

  return (
    <>
      {Array.from(Array(maxLines)).map((_, i) => {
        const lyricsLine = lyricsLines[i] ?? '';
        const chordsLine = chordsLines[i] ?? '';
        return (
          <>
            {i > 0 && '\n'}
            <b>{chordsLine}</b>
            {'\n' + lyricsLine}
          </>
        );
      })}
    </>
  );
}
