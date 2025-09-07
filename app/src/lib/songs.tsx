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

const chordsRegex = /\s[A-G](#{1,2}|b{1,2})?\d*(M|maj|m|min|sus|º|\+)?\d*(\(\d*[+-]?\))?([\\\/][A-G](#{1,2}|b{1,2})?)?\s/gi;
export const getChordsData = (text: string) => {
  const words = text.replace(/[\[\]\(\)]+/gi, '').replace(/\s+/gi, ' ').trim().split(/\s/gi);
  const chordsIter = (` ${text} `).matchAll(chordsRegex);
  const chords = Array.from(chordsIter, m => m[0].trim());

  return {
    wordCount: words.length,
    chordCount: chords ? chords.length : 0,
    chords: chords,
    proportion: chords && words.length > 0 ? chords.length / words.length : 0,
  }
}
