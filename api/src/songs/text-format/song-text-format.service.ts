import { Injectable } from '@nestjs/common';
import { dump, load } from 'js-yaml';
import { SongPart, SongPartLine } from 'src/entities';

export interface SongExportReference {
  url: string;
  name?: string;
}

export interface SongExportData {
  title: string;
  artist: string;
  language?: string | null;
  blocks: SongPart[];
  references: SongExportReference[];
}

export class SongTextFormatError extends Error {
  constructor(
    message: string,
    readonly line?: number,
  ) {
    super(line === undefined ? message : `${message} (line ${line})`);
    this.name = 'SongTextFormatError';
  }
}

const SCHEMA_VERSION = 1;
const LYRICS_PREFIX = '- ';
const CHORDS_PREFIX = '* ';
const COMMENTS_PREFIX = '> ';
const TAG_PATTERN = /^\[([A-Za-z0-9]{1,8})\](?: (.*))?$/;

const CONTENT_LINE_PREFIXES = [
  { prefix: LYRICS_PREFIX, type: 'lyrics' },
  { prefix: CHORDS_PREFIX, type: 'chords' },
  { prefix: COMMENTS_PREFIX, type: 'comments' },
] as const;

function singleLine(value: string): string {
  return value.replace(/\r?\n/g, ' ');
}

@Injectable()
export class SongTextFormatService {
  encode(song: SongExportData): string {
    const meta: Record<string, unknown> = { schemaVersion: SCHEMA_VERSION };
    if (song.language) {
      meta.language = song.language;
    }
    if (song.references?.length) {
      meta.references = song.references;
    }

    const body: string[] = [
      `# ${singleLine(song.title)}`,
      `## ${singleLine(song.artist)}`,
    ];
    for (const part of song.blocks ?? []) {
      body.push('', `### ${this.partHeader(part)}`);
      for (const line of part.lines ?? []) {
        const prefix =
          line.type === 'chords'
            ? CHORDS_PREFIX
            : line.type === 'comments'
              ? COMMENTS_PREFIX
              : LYRICS_PREFIX;
        body.push(`${prefix}${line.content ?? ''}`);
      }
    }

    return `---\n${dump(meta, { lineWidth: -1 }).trimEnd()}\n---\n\n${body
      .map((line) => line.replace(/\s+$/, ''))
      .join('\n')}\n`;
  }

  decode(text: string): SongExportData {
    const lines = text.replace(/\r\n?/g, '\n').split('\n');

    if ((lines[0] ?? '').replace(/\s+$/, '') !== '---') {
      throw new SongTextFormatError(
        'Missing frontmatter: file must start with ---',
        1,
      );
    }

    let frontmatterEnd = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') {
        frontmatterEnd = i;
        break;
      }
    }
    if (frontmatterEnd === -1) {
      throw new SongTextFormatError(
        'Unterminated frontmatter: missing closing ---',
      );
    }

    const meta = this.parseFrontmatter(
      lines.slice(1, frontmatterEnd).join('\n'),
    );
    const parsedBody = this.parseBody(
      lines.slice(frontmatterEnd + 1),
      frontmatterEnd + 2,
    );

    return {
      title: parsedBody.title,
      artist: parsedBody.artist,
      language: meta.language ?? null,
      blocks: parsedBody.blocks,
      references: meta.references,
    };
  }

  private parseFrontmatter(yamlText: string): {
    language?: string;
    references: SongExportReference[];
  } {
    let meta: unknown;
    try {
      meta = yamlText.trim() === '' ? {} : load(yamlText);
    } catch (error) {
      throw new SongTextFormatError(
        `Invalid YAML frontmatter: ${(error as Error).message}`,
      );
    }

    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
      throw new SongTextFormatError('Frontmatter must be a YAML mapping');
    }

    const { schemaVersion, language, references } = meta as Record<
      string,
      unknown
    >;
    if (
      typeof schemaVersion !== 'number' ||
      !Number.isFinite(schemaVersion) ||
      Math.floor(schemaVersion) !== SCHEMA_VERSION
    ) {
      throw new SongTextFormatError(
        `Unsupported schemaVersion ${String(schemaVersion)} (supported: ${SCHEMA_VERSION}.x)`,
      );
    }

    if (
      language !== undefined &&
      language !== null &&
      (typeof language !== 'string' || !/^[A-Za-z]{2}$/.test(language))
    ) {
      throw new SongTextFormatError(
        'Invalid language in frontmatter: expected a 2-letter code',
      );
    }

    return {
      language: typeof language === 'string' ? language : undefined,
      references: this.parseReferences(references),
    };
  }

  private parseReferences(value: unknown): SongExportReference[] {
    if (value === undefined || value === null) {
      return [];
    }
    if (!Array.isArray(value)) {
      throw new SongTextFormatError('references in frontmatter must be a list');
    }
    return value.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new SongTextFormatError(
          `Invalid reference at index ${index}: must be a mapping`,
        );
      }
      const { url, name: referenceName } = item as Record<string, unknown>;
      if (typeof url !== 'string' || url === '') {
        throw new SongTextFormatError(
          `Invalid reference at index ${index}: url must be a non-empty string`,
        );
      }
      let name: string | undefined;
      if (referenceName !== undefined) {
        if (typeof referenceName !== 'string') {
          throw new SongTextFormatError(
            `Invalid reference at index ${index}: name must be a string`,
          );
        }
        name = referenceName;
      }
      return name === undefined ? { url } : { url, name };
    });
  }

  private parseBody(
    lines: string[],
    firstLineNumber: number,
  ): { title: string; artist: string; blocks: SongPart[] } {
    let title: string | undefined;
    let artist: string | undefined;
    const blocks: SongPart[] = [];
    let current: SongPart | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].replace(/\s+$/, '');
      const lineNumber = firstLineNumber + i;
      if (line === '') {
        continue;
      }

      if (title === undefined) {
        if (line === '#' || line.startsWith('# ')) {
          title = line.slice(2);
          continue;
        }
        throw new SongTextFormatError(
          'Expected the song title as a level 1 header (# …)',
          lineNumber,
        );
      }

      if (artist === undefined) {
        if (line === '##' || line.startsWith('## ')) {
          artist = line.slice(3);
          continue;
        }
        throw new SongTextFormatError(
          'Expected the artist as a level 2 header (## …)',
          lineNumber,
        );
      }

      if (line === '###' || line.startsWith('### ')) {
        current = this.parsePartHeader(line === '###' ? '' : line.slice(4));
        blocks.push(current);
        continue;
      }

      if (line.startsWith('####')) {
        throw new SongTextFormatError(
          'Headers deeper than level 3 are not supported',
          lineNumber,
        );
      }

      if (current === undefined) {
        throw new SongTextFormatError(
          `Content before the first part header (### …): ${JSON.stringify(line)}`,
          lineNumber,
        );
      }

      const contentLine = this.parseContentLine(line);
      if (!contentLine) {
        throw new SongTextFormatError(
          `Unexpected line: content lines must start with "- ", "* " or "> ": ${JSON.stringify(line)}`,
          lineNumber,
        );
      }
      current.lines.push(contentLine);
    }

    if (title === undefined) {
      throw new SongTextFormatError('Missing song title header (# …) in body');
    }
    if (artist === undefined) {
      throw new SongTextFormatError('Missing artist header (## …) in body');
    }

    return { title, artist, blocks };
  }

  private parsePartHeader(rest: string): SongPart {
    const part: SongPart = { lines: [] };
    if (rest === '') {
      return part;
    }
    const tagMatch = TAG_PATTERN.exec(rest);
    if (tagMatch) {
      part.acronym = tagMatch[1];
      if (tagMatch[2]) {
        part.name = tagMatch[2];
      }
    } else {
      part.name = rest;
    }
    return part;
  }

  private parseContentLine(line: string): SongPartLine | undefined {
    for (const { prefix, type } of CONTENT_LINE_PREFIXES) {
      const barePrefix = prefix.trimEnd();
      if (line === barePrefix || line.startsWith(prefix)) {
        return {
          type,
          content: line === barePrefix ? '' : line.slice(prefix.length),
        };
      }
    }
    return undefined;
  }

  private partHeader(part: SongPart): string {
    const name = singleLine(part.name ?? '');
    if (!part.acronym) {
      return name;
    }
    return `[${part.acronym}]${name ? ` ${name}` : ''}`;
  }
}
