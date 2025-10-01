import { ReactNode } from "react";
import { cn } from "./utils";

export const alternateLyricsAndChords = (lyrics?: string, chords?: string, options?: {
  lyricsClassName?: string;
  lyricsStyle?: any;
  chordsClassName?: string;
  chordsStyle?: any;
}): ReactNode => {

  const hasLyrics = (lyrics?.trim() ?? '').length > 0;
  const hasChords = (chords?.trim() ?? '').length > 0;

  if (!hasLyrics && !hasChords) {
    return null;
  }

  if (!hasLyrics) {
    return (
      <p className={cn('chords', options?.chordsClassName)} style={options?.chordsStyle}>{chords}</p>
    );
  }

  const resolvedLyricsClassName = cn('lyrics', options?.lyricsClassName);

  const lyricsLines = (lyrics ?? '').split(/\n/);
  if (!hasChords) {
    return (
      <>
        {lyricsLines.map((line, ix) => (
          <p key={`lyrics-${ix}`} className={resolvedLyricsClassName} style={options?.lyricsStyle}>{line}</p>
        ))}
      </>
    );
  }

  const chordsLines = (chords ?? '').split(/\n/);
  const maxLines = Math.max(lyricsLines.length, chordsLines.length);
  const resolvedChordsClassName = cn('chords', options?.lyricsClassName);

  return (
    <>
      {Array.from(Array(maxLines)).map((_, i) => {
        const lyricsLine = i < lyricsLines.length ? lyricsLines[i].trimEnd() : '';
        const chordsLine = i < chordsLines.length ? chordsLines[i].trimEnd() : '';

        if (lyricsLine.length === 0 && chordsLine.length === 0) {
          return null;
        }

        return (
          <>
            <p key={`chords-${i}`} className={resolvedChordsClassName} style={options?.chordsStyle}>{chordsLine}</p>
            <p key={`lyrics-${i}`} className={resolvedLyricsClassName} style={options?.lyricsStyle}>{lyricsLine}</p>
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

const capitalizeEachSentence = (text: string) => {
  return text.replace(/([\.\?!])\s*([A-Za-zÀ-ÖØ-öø-ÿ])/gui, (match, punctuation, letter) => {
    return punctuation + match.slice(1, -1) + letter.toUpperCase();
  })
}

const capitalizeEachLine = (text: string) => {
  return text.replace(/(\n)\s*([A-Za-zÀ-ÖØ-öø-ÿ])/gui, (match, newline, letter) => {
    return newline + match.slice(1, -1) + letter.toUpperCase();
  });
}

export const capitalizeText = (text: string) => {

  text = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  text = capitalizeEachLine(text);
  text = capitalizeEachSentence(text);

  return text;
}
