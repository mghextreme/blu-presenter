import { ReactNode } from "react";
import { INumberedSongPart, ISongPart, ISongPartLine, SongPartLineType } from "@/types";
import { cn } from "./utils";
import { api } from "./config";

// ─── JSX rendering ────────────────────────────────────────────────────────────

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

// ─── Chord detection ──────────────────────────────────────────────────────────

const chordsRegex = /(?<=\s)[A-G](#{1,2}|b{1,2})?\(?\d*(M|maj|m|min|sus|º|\+)?\d*(\(\d*[+-]?\))?([\\\/][A-G](#{1,2}|b{1,2})?)?\)?(?=\s)/gi;
export const getChordsData = (text: string) => {
  const words = text.replace(/[\[\]\(\)]+/gi, '').replace(/\s+/gi, ' ').trim().split(/\s/gi);
  const chordsIter = (` ${text} `).matchAll(chordsRegex);
  const chords = Array.from(chordsIter, m => m[0].trim());

  return {
    wordCount: words.length,
    chordCount: chords.length,
    chords,
    proportion: words.length > 0 ? chords.length / words.length : 0,
  }
}

// ─── Capitalize ───────────────────────────────────────────────────────────────

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

// ─── Reference URL helpers ────────────────────────────────────────────────────

/** Checks if a hostname matches the given domain or is a subdomain of it. */
function isHostname(hostname: string, domain: string): boolean {
  const normalized = hostname.replace('www.', '');
  return normalized === domain || normalized.endsWith(`.${domain}`);
}

export type ReferenceType =
  | 'spotify'
  | 'youtube'
  | 'deezer'
  | 'soundcloud'
  | 'apple-music'
  | 'tidal'
  | 'other';

export function getSpotifyTrackId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!isHostname(parsed.hostname, 'spotify.com')) return null;
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

export function getDeezerTrackId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!isHostname(parsed.hostname, 'deezer.com')) return null;
    // Matches /track/{id} with optional locale prefix, e.g. /en/track/123 or /track/123
    const match = parsed.pathname.match(/\/track\/(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Recognizes Deezer share/short links (link.deezer.com/s/...).
 * Returns the URL if it matches, or null.
 */
export function getDeezerShareUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace('www.', '');
    if (hostname !== 'link.deezer.com') return null;
    // Short links have a path like /s/{code}
    if (!parsed.pathname.match(/^\/s\/.+/)) return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * Resolves a Deezer share/short link to a track ID by calling the API's
 * resolve-redirect endpoint (needed because link.deezer.com blocks CORS).
 */
export async function resolveDeezerShareUrl(url: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const timeoutMs = 20_000;
    const abortController = new AbortController();

    // Combine the caller's signal (if any) with a timeout signal
    const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);
    signal?.addEventListener('abort', () => abortController.abort(), { once: true });

    const response = await fetch(
      `${api.url}/resolve-redirect?url=${encodeURIComponent(url)}`,
      { signal: abortController.signal },
    );
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const resolvedUrl: string | undefined = data?.url;
    if (!resolvedUrl) return null;

    return getDeezerTrackId(resolvedUrl);
  } catch {
    return null;
  }
}

export function getSoundCloudUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace('www.', '');
    if (hostname !== 'soundcloud.com') return null;
    // Must have at least /user/track (two path segments after the leading /)
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length < 2) return null;
    return url;
  } catch {
    return null;
  }
}

export function getAppleMusicEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!isHostname(parsed.hostname, 'music.apple.com')) return null;
    // Must be an album (with optional ?i= for track) or song path
    if (!parsed.pathname.match(/\/(album|song)\//)) return null;
    // Transform music.apple.com → embed.music.apple.com
    const embedUrl = new URL(url);
    embedUrl.hostname = 'embed.music.apple.com';
    return embedUrl.toString();
  } catch {
    return null;
  }
}

export function getTidalTrackId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace('www.', '');
    if (hostname !== 'tidal.com' && hostname !== 'listen.tidal.com') return null;
    // Matches /track/{id} or /browse/track/{id}
    const match = parsed.pathname.match(/\/track\/(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export function getReferenceType(url: string): ReferenceType {
  if (getSpotifyTrackId(url)) return 'spotify';
  if (getYouTubeVideoId(url)) return 'youtube';
  if (getDeezerTrackId(url) || getDeezerShareUrl(url)) return 'deezer';
  if (getSoundCloudUrl(url)) return 'soundcloud';
  if (getAppleMusicEmbedUrl(url)) return 'apple-music';
  if (getTidalTrackId(url)) return 'tidal';
  return 'other';
}

export type EmbedInfo =
  | { type: 'spotify'; trackId: string }
  | { type: 'youtube'; videoId: string }
  | { type: 'deezer'; trackId?: string; shareUrl?: string }
  | { type: 'soundcloud'; trackUrl: string }
  | { type: 'apple-music'; embedUrl: string }
  | { type: 'tidal'; trackId: string }
  | { type: 'other' }
  | null;

/**
 * Derives embed-specific parameters from a reference URL in a single pass.
 * Returns null when there is no active URL.
 */
export function getEmbedInfo(url: string | null): EmbedInfo {
  if (!url) return null;

  const spotifyId = getSpotifyTrackId(url);
  if (spotifyId) return { type: 'spotify', trackId: spotifyId };

  const ytId = getYouTubeVideoId(url);
  if (ytId) return { type: 'youtube', videoId: ytId };

  const deezerId = getDeezerTrackId(url);
  const deezerShare = getDeezerShareUrl(url);
  if (deezerId || deezerShare) return { type: 'deezer', trackId: deezerId ?? undefined, shareUrl: deezerShare ?? undefined };

  const scUrl = getSoundCloudUrl(url);
  if (scUrl) return { type: 'soundcloud', trackUrl: scUrl };

  const appleUrl = getAppleMusicEmbedUrl(url);
  if (appleUrl) return { type: 'apple-music', embedUrl: appleUrl };

  const tidalId = getTidalTrackId(url);
  if (tidalId) return { type: 'tidal', trackId: tidalId };

  return { type: 'other' };
}

// ─── Chord transposition ──────────────────────────────────────────────────────

const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Returns the chromatic index (0–11) for a note name like C, C#, Db, Bb, etc. */
function noteIndex(note: string): number {
  const idx = SHARPS.indexOf(note);
  if (idx !== -1) return idx;
  return FLATS.indexOf(note);
}

/**
 * Transposes a single note name by `semitones`.
 * `useFlats` controls the output spelling (sharp vs flat enharmonic).
 */
export function transposeNote(note: string, semitones: number, useFlats: boolean): string {
  const idx = noteIndex(note);
  if (idx === -1) return note; // unknown note — leave as-is
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return useFlats ? FLATS[newIdx] : SHARPS[newIdx];
}

// Matches a note name (root or bass): A-G followed by optional # or b (single only)
const NOTE_RE = /^([A-G])(#{1,2}|b{1,2})?/;

/**
 * Transposes a single chord token (e.g. "F#m7/C#") by `semitones`.
 * `useFlats` controls output spelling for newly-created accidentals.
 */
export function transposeChordToken(chord: string, semitones: number, useFlats: boolean): string {
  const m = chord.match(NOTE_RE);
  if (!m) return chord;

  const rawRoot = m[1] + (m[2] ?? '');
  let root = rawRoot;
  if (rawRoot.endsWith('##')) root = SHARPS[(noteIndex(m[1]) + 2) % 12];
  else if (rawRoot.endsWith('bb')) root = FLATS[((noteIndex(m[1]) - 2) + 12) % 12];

  const transposedRoot = transposeNote(root, semitones, useFlats);
  const suffix = chord.slice(rawRoot.length);

  // Handle bass note after '/' (e.g. "/C#")
  const bassMatch = suffix.match(/([/\\])([A-G])(#{1,2}|b{1,2})?(.*)$/);
  if (bassMatch) {
    const sep = bassMatch[1];
    const rawBass = bassMatch[2] + (bassMatch[3] ?? '');
    let bass = rawBass;
    if (rawBass.endsWith('##')) bass = SHARPS[(noteIndex(bassMatch[2]) + 2) % 12];
    else if (rawBass.endsWith('bb')) bass = FLATS[((noteIndex(bassMatch[2]) - 2) + 12) % 12];
    const transposedBass = transposeNote(bass, semitones, useFlats);
    const beforeBass = suffix.slice(0, bassMatch.index);
    const afterBass = bassMatch[4];
    return transposedRoot + beforeBass + sep + transposedBass + afterBass;
  }

  return transposedRoot + suffix;
}

// Matches a chord token preceded by a captured whitespace run and followed by whitespace.
const CHORD_TOKEN_WITH_SPACE_RE = /(\s)([A-G](#{1,2}|b{1,2})?\(?\d*(M|maj|m|min|sus|º|\+)?\d*(\(\d*[+-]?\))?([\\\/][A-G](#{1,2}|b{1,2})?)?\)?)(?=\s)/g;

/**
 * Transposes all chord tokens in a chord-line string by `semitones`,
 * adjusting trailing whitespace so that subsequent columns stay aligned.
 */
export function transposeLine(line: string, semitones: number, useFlats?: boolean): string {
  const resolvedUseFlats = useFlats !== undefined ? useFlats : semitones < 0;
  const padded = ` ${line} `;

  const matches: Array<{ index: number; fullMatch: string; lead: string; token: string }> = [];
  let m: RegExpExecArray | null;
  CHORD_TOKEN_WITH_SPACE_RE.lastIndex = 0;
  while ((m = CHORD_TOKEN_WITH_SPACE_RE.exec(padded)) !== null) {
    matches.push({ index: m.index, fullMatch: m[0], lead: m[1], token: m[2] });
  }

  let result = padded;
  for (let i = matches.length - 1; i >= 0; i--) {
    const { index, lead, token } = matches[i];
    const transposed = transposeChordToken(token, semitones, resolvedUseFlats);
    const delta = transposed.length - token.length;

    const tokenStart = index + lead.length;
    const tokenEnd = tokenStart + token.length;
    let trailingEnd = tokenEnd;
    while (trailingEnd < result.length && result[trailingEnd] === ' ') trailingEnd++;
    const trailingSpaces = trailingEnd - tokenEnd;

    const newTrailing = Math.max(1, trailingSpaces - delta);
    result =
      result.slice(0, tokenStart) +
      transposed +
      ' '.repeat(newTrailing) +
      result.slice(trailingEnd);
  }

  return result.slice(1).trimEnd();
}

/**
 * Swaps every accidental in a chord line: # ↔ b (enharmonic re-spelling, same pitch).
 */
export function swapAccidentals(line: string): string {
  const sharpCount = (line.match(/[A-G]#/g) ?? []).length;
  const flatCount  = (line.match(/[A-G]b/g) ?? []).length;
  const targetFlats = sharpCount > flatCount;
  return transposeLine(line, 0, targetFlats);
}

/**
 * Derives a short acronym (1-3 chars) from a part name using pure text rules.
 */
export function deriveAcronym(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';

  const trailingNumberMatch = trimmed.match(/\s+(\d+)$/);
  const trailingNumber = trailingNumberMatch ? trailingNumberMatch[1] : '';
  const withoutNumber = trailingNumber ? trimmed.slice(0, -trailingNumberMatch![0].length) : trimmed;

  const segments = withoutNumber.split(/[\s\-]+/).filter(Boolean);
  const initials = segments
    .slice(0, 3)
    .map(s => s.charAt(0).toUpperCase())
    .join('');

  return initials + trailingNumber;
}

/**
 * Returns true if two song parts have identical line content (type + text).
 * Ignores name and acronym — used for deduplication and propagation.
 */
export function isBlockEqual(a: Pick<ISongPart, 'lines'>, b: Pick<ISongPart, 'lines'>): boolean {
  if (a.lines.length !== b.lines.length) return false;
  return a.lines.every((line, i) =>
    line.type === b.lines[i].type && line.content === b.lines[i].content
  );
}

// Matches guitar tablature lines like "E|4-12----------|" or "e|---0---2---|"
const guitarTabRegex = /^[A-Ga-g]#?\|[\d\-\/\\hpbrs~x|().^ ]+\|?\s*$/;

export function detectLineType(text: string): SongPartLineType {
  const trimmed = text.trim();
  if (trimmed === '') return 'lyrics';
  if (guitarTabRegex.test(trimmed)) return 'comments';
  const data = getChordsData(trimmed);
  return data.proportion >= 0.75 ? 'chords' : 'lyrics';
}

// ─── Numbered blocks for print view ──────────────────────────────────────────

export interface NumberedBlocksResult {
  numberedBlocks: INumberedSongPart[];
  compactedBlocks: INumberedSongPart[];
  acronymSequence: string[];
}

export function computeNumberedBlocks(blocks: ISongPart[]): NumberedBlocksResult {
  const simplifiedAcronymSequence: string[] = [];
  const simplifiedBlocks: INumberedSongPart[] = [];
  const sequencedBlocks: INumberedSongPart[] = [];

  for (let ix = 0; ix < blocks.length; ix++) {
    const sourceBlock = blocks[ix] ?? { lines: [] } as ISongPart;
    let added = false;
    let sequenceNumber: number | undefined = undefined;

    for (let jx = 0; jx < simplifiedBlocks.length; jx++) {
      const comparisonBlock = simplifiedBlocks[jx];
      if (isBlockEqual(sourceBlock, comparisonBlock)) {
        sequenceNumber = jx + 1;
        simplifiedAcronymSequence.push(comparisonBlock.acronym ?? String(sequenceNumber));
        added = true;
        break;
      }
    }

    if (sequenceNumber) {
      sequencedBlocks.push({ ...sourceBlock, sequence: sequenceNumber, isFirstAppearance: false });
    } else {
      sequencedBlocks.push({ ...sourceBlock, sequence: simplifiedBlocks.length + 1, isFirstAppearance: true });
    }

    if (!added) {
      simplifiedAcronymSequence.push(sourceBlock.acronym ?? String(simplifiedBlocks.length + 1));
      simplifiedBlocks.push({ ...sourceBlock, sequence: simplifiedBlocks.length + 1 });
    }
  }

  return {
    numberedBlocks: sequencedBlocks,
    compactedBlocks: simplifiedBlocks,
    acronymSequence: simplifiedAcronymSequence,
  };
}

/**
 * Returns the first Spotify URL found in a references array, or undefined.
 */
export function findSpotifyUrl(references?: { url: string }[]): string | undefined {
  return references?.find((ref) => ref.url.includes('spotify.com'))?.url;
}

/**
 * Pairs consecutive lyrics lines into groups of two joined by `\n`.
 * Used when rendering lyrics as slides (two lines per slide).
 * Example: ["A", "B", "C", "D"] → ["A\nB", "C\nD"]
 */
export function pairLyricsLines(lines: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    let part = lines[i];
    if (i + 1 < lines.length) part += '\n' + lines[i + 1];
    result.push(part);
  }
  return result;
}

// ─── Song text parser ─────────────────────────────────────────────────────────

interface ParsedSong {
  title: string;
  artist: string;
  blocks: ISongPart[];
}

export function parseSongText(fullText: string): ParsedSong {
  const rawLines = fullText.split(/\n/);

  // Strip leading and trailing empty lines
  while (rawLines.length > 0 && rawLines[0].trim() === '') rawLines.shift();
  while (rawLines.length > 0 && rawLines[rawLines.length - 1].trim() === '') rawLines.pop();

  let title = '';
  let artist = '';
  let bodyStart = 0;

  if (rawLines.length >= 3) {
    const firstLine = rawLines[0].trim();
    const secondLine = rawLines[1].trim();
    const thirdLine = rawLines[2].trim();

    if (
      firstLine && detectLineType(firstLine) !== 'chords' &&
      secondLine && detectLineType(secondLine) !== 'chords' &&
      thirdLine === ''
    ) {
      title = firstLine;
      artist = secondLine;
      bodyStart = 3;
    } else if (
      firstLine && detectLineType(firstLine) !== 'chords' &&
      secondLine === ''
    ) {
      title = firstLine;
      bodyStart = 2;
    }
  } else if (rawLines.length === 2) {
    const firstLine = rawLines[0].trim();
    const secondLine = rawLines[1].trim();

    if (
      firstLine && detectLineType(firstLine) !== 'chords' &&
      secondLine === ''
    ) {
      title = firstLine;
      bodyStart = 2;
    }
  }

  // Skip any remaining empty lines between header and body
  while (bodyStart < rawLines.length && rawLines[bodyStart].trim() === '') bodyStart++;

  // Parse remaining lines into blocks, splitting on empty lines.
  // 3 or more consecutive empty lines between parts inserts an extra empty block.
  const blocks: ISongPart[] = [];
  let currentLines: ISongPartLine[] = [];
  let emptyLineCount = 0;

  for (let i = bodyStart; i < rawLines.length; i++) {
    const line = rawLines[i];
    const isEmpty = line.trim() === '';

    if (isEmpty) {
      if (currentLines.length > 0 && emptyLineCount === 0) {
        // First empty line after content — flush the current block
        blocks.push({
          id: blocks.length,
          lines: currentLines,
        });
        currentLines = [];
      }
      emptyLineCount++;
      continue;
    }

    // Non-empty line: if we had ≥3 empty lines since the last block, insert an empty block
    if (emptyLineCount >= 3 && blocks.length > 0) {
      blocks.push({
        id: blocks.length,
        lines: [],
      });
    }
    emptyLineCount = 0;

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

  return { title, artist, blocks };
}
