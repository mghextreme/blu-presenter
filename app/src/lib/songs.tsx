import { ReactNode } from "react";
import { ISongPart, ISongPartLine, SongPartLineType } from "@/types";
import { cn } from "./utils";

export const renderSongPartLines = (lines?: ISongPartLine[], options?: {
  includeTypes?: SongPartLineType[];
  lyricsClassName?: string;
  lyricsStyle?: React.CSSProperties;
  chordsClassName?: string;
  chordsStyle?: React.CSSProperties;
  commentsClassName?: string;
  commentsStyle?: React.CSSProperties;
  firstLineCompactMode?: boolean;
}): ReactNode => {

  if (!lines || lines.length === 0) {
    return null;
  }

  const filteredLines = options?.includeTypes
    ? lines.filter(line => options.includeTypes!.includes(line.type))
    : lines;

  if (filteredLines.length === 0) {
    return null;
  }

  const resolvedLyricsClassName = cn(
    'lyrics',
    options?.lyricsClassName,
    options?.firstLineCompactMode && 'opacity-60 italic',
  );
  const resolvedChordsClassName = cn('chords', options?.chordsClassName);
  const resolvedCommentsClassName = cn('comments', options?.commentsClassName);

  if (options?.firstLineCompactMode) {
    const firstLyricsLine = filteredLines.find(line => line.type === 'lyrics');
    if (firstLyricsLine) {
      return <p key="lyrics-firstLine" className={resolvedLyricsClassName} style={options?.lyricsStyle}>{firstLyricsLine.content}...</p>;
    }
    return null;
  }

  return (
    <>
      {filteredLines.map((line, ix) => {
        const content = line.content.trimEnd();
        if (content.length === 0) {
          return null;
        }

        switch (line.type) {
          case 'chords':
            return <p key={`chords-${ix}`} className={resolvedChordsClassName} style={options?.chordsStyle}>{content}</p>;
          case 'comments':
            return <p key={`comments-${ix}`} className={resolvedCommentsClassName} style={options?.commentsStyle}>{content}</p>;
          case 'lyrics':
          default:
            return <p key={`lyrics-${ix}`} className={resolvedLyricsClassName} style={options?.lyricsStyle}>{content}</p>;
        }
      })}
    </>
  );
}

const chordsRegex = /(?<=\s)[A-G](#{1,2}|b{1,2})?\(?\d*(M|maj|m|min|sus|º|\+)?\d*(\(\d*[+-]?\))?([\\\/][A-G](#{1,2}|b{1,2})?)?\)?(?=\s)/gi;
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

export type ReferenceType = 'spotify' | 'youtube' | 'other';

export function getSpotifyTrackId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('spotify.com')) return null;
    const match = parsed.pathname.match(/\/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace('www.', '');

    if (hostname === 'youtube.com' || hostname === 'music.youtube.com') {
      return parsed.searchParams.get('v');
    }

    if (hostname === 'youtu.be') {
      const id = parsed.pathname.slice(1);
      return id.length > 0 ? id : null;
    }

    return null;
  } catch {
    return null;
  }
}

export function getReferenceType(url: string): ReferenceType {
  if (getSpotifyTrackId(url)) return 'spotify';
  if (getYouTubeVideoId(url)) return 'youtube';
  return 'other';
}

export function detectLineType(text: string): SongPartLineType {
  const trimmed = text.trim();
  if (trimmed === '') return 'lyrics';
  const data = getChordsData(trimmed);
  return data.proportion >= 0.75 ? 'chords' : 'lyrics';
}

export function parseSongText(fullText: string): ISongPart[] {
  const rawLines = fullText.split(/\n/);
  const blocks: ISongPart[] = [];

  let currentLines: ISongPartLine[] = [];
  let emptyCount = 0;

  for (const line of rawLines) {
    const isEmpty = line.trim() === '';

    if (isEmpty) {
      emptyCount++;
      if (emptyCount >= 2 && currentLines.length > 0) {
        blocks.push({
          id: blocks.length,
          lines: currentLines,
        });
        currentLines = [];
      }
      continue;
    }

    emptyCount = 0;
    currentLines.push({
      type: detectLineType(line),
      content: line,
    });
  }

  if (currentLines.length > 0) {
    blocks.push({
      id: blocks.length,
      lines: currentLines,
    });
  }

  return blocks;
}
