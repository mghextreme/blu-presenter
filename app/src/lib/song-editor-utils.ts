import { ISongPart, SongPartLineType } from "@/types";
import { detectLineType, isBlockEqual } from "@/lib/songs";

// ─── Types ──────────────────────────────────────────────────────

export interface IEditorLine {
  /**
   * Stable per-line identity. Allows the editor to anchor metadata
   * (type, manuallySet) to a specific line of content rather than to
   * a positional index that shifts on insert/delete.
   */
  key: number;
  content: string;
  type: SongPartLineType;
  manuallySet: boolean;
}

export interface IEditorPart {
  key: number;
  lines: IEditorLine[];
  name?: string;
  acronym?: string;
}

export interface SavedSelection {
  anchorIdx: number;
  anchorOffset: number;
  focusIdx: number;
  focusOffset: number;
}

export interface SepPos {
  key: number;
  partIndex: number;
  top: number;
}

export interface GutterLine {
  partIndex: number;
  lineIndex: number;
  line: IEditorLine;
  top: number;
  height: number;
}

// ─── Constants ──────────────────────────────────────────────────

export function createEmptyLine(): IEditorLine {
  return { key: nextLineKey(), content: '', type: 'lyrics', manuallySet: false };
}

const LINE_TYPES: SongPartLineType[] = ['lyrics', 'chords', 'comments'];

export const PART_ATTR = 'data-part-key';
export const SEP_ATTR = 'data-separator';
export const LINE_ATTR = 'data-line-key';

// ─── Pure utility functions ─────────────────────────────────────

let globalPartKeyCounter = 0;
let globalLineKeyCounter = 0;

export function nextPartKey(): number {
  return globalPartKeyCounter++;
}

export function nextLineKey(): number {
  return globalLineKeyCounter++;
}

export function cycleLineType(current: SongPartLineType): SongPartLineType {
  const idx = LINE_TYPES.indexOf(current);
  return LINE_TYPES[(idx + 1) % LINE_TYPES.length];
}

export function blocksToEditorParts(blocks: ISongPart[]): IEditorPart[] {
  if (!blocks || blocks.length === 0) {
    return [{ key: nextPartKey(), lines: [createEmptyLine()] }];
  }
  return blocks.map((block) => ({
    key: nextPartKey(),
    name: block.name,
    acronym: block.acronym,
    lines: block.lines.length > 0
      ? block.lines.map((line) => ({ key: nextLineKey(), content: line.content, type: line.type, manuallySet: true }))
      : [createEmptyLine()],
  }));
}

export function editorPartsToBlocks(parts: IEditorPart[]): ISongPart[] {
  return parts.map((part, ix) => ({
    id: ix,
    name: part.name,
    acronym: part.acronym,
    lines: part.lines
      .filter((l) => l.content.trim() !== '')
      .map((l) => ({ type: l.type, content: l.content })),
  })).filter((b) => b.lines.length > 0);
}

export function lineClassName(type: SongPartLineType): string {
  switch (type) {
    case 'chords': return 'editor-line font-bold text-primary';
    case 'comments': return 'editor-line italic text-green-600 dark:text-green-600';
    default: return 'editor-line';
  }
}

/**
 * Splits parts at double-empty-line boundaries and propagates names
 * from content-equal parts.
 */
export function splitAtDoubleEmpty(input: IEditorPart[]): IEditorPart[] {
  const result: IEditorPart[] = [];
  for (const part of input) {
    let buf: IEditorLine[] = [];
    let isFirst = true;
    for (let i = 0; i < part.lines.length; i++) {
      const line = part.lines[i];
      const next = part.lines[i + 1];
      if (line.content.trim() === '' && next && next.content.trim() === '') {
        if (buf.length > 0 || isFirst) {
          result.push({
            key: isFirst ? part.key : nextPartKey(),
            name: isFirst ? part.name : undefined,
            acronym: isFirst ? part.acronym : undefined,
            lines: buf.length > 0 ? buf : [createEmptyLine()],
          });
          isFirst = false;
        }
        buf = [];
        i++; // skip next empty line
        continue;
      }
      buf.push(line);
    }
    result.push({
      key: isFirst ? part.key : nextPartKey(),
      name: isFirst ? part.name : undefined,
      acronym: isFirst ? part.acronym : undefined,
      lines: buf.length > 0 ? buf : [createEmptyLine()],
    });
  }

  // For any newly created part without a name, check if its content matches
  // an existing named part in the result and inherit that name + acronym.
  for (let i = 0; i < result.length; i++) {
    if (result[i].name) continue;
    const match = result.find((other, j) => j !== i && !!other.name && isBlockEqual(
      { lines: result[i].lines.filter(l => l.content.trim() !== '').map(l => ({ type: l.type, content: l.content })) },
      { lines: other.lines.filter(l => l.content.trim() !== '').map(l => ({ type: l.type, content: l.content })) },
    ));
    if (match) {
      result[i] = { ...result[i], name: match.name, acronym: match.acronym };
    }
  }

  return result;
}

/**
 * Parses the contentEditable DOM back into IEditorPart[].
 *
 * Lines are matched to existing state by their `data-line-key` attribute,
 * not by positional index. This means a manually-set type stays anchored
 * to its line of content even when other lines are inserted or removed
 * above it. Divs without a `data-line-key` (typically created by the
 * browser's default Enter behavior or by paste) get a fresh key and have
 * their type detected from content.
 */
export function parseEditorDOM(
  editor: HTMLDivElement,
  currentParts: IEditorPart[],
): IEditorPart[] {
  // Build an index of every existing line by key so we can match across
  // parts (e.g. when a paste/Enter rearranges lines into different parts).
  const linesByKey = new Map<number, IEditorLine>();
  for (const p of currentParts) {
    for (const l of p.lines) linesByKey.set(l.key, l);
  }

  // Track keys that have already been claimed in this parse pass. The
  // browser's default Enter behavior clones the current div (including
  // its data-line-key attribute), producing two DOM lines with the same
  // key. The first occurrence (original) keeps the key; later duplicates
  // are treated as brand new lines with fresh keys and detected types.
  const claimedKeys = new Set<number>();

  const result: IEditorPart[] = [];
  const partDivs = editor.querySelectorAll<HTMLElement>('.editor-part');

  for (let pi = 0; pi < partDivs.length; pi++) {
    const partDiv = partDivs[pi];
    const keyStr = partDiv.getAttribute(PART_ATTR);
    const existing = currentParts.find(p => String(p.key) === keyStr);
    const partKey = existing?.key ?? nextPartKey();
    const lines: IEditorLine[] = [];

    for (const child of Array.from(partDiv.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const c = child.textContent ?? '';
        lines.push({ key: nextLineKey(), content: c, type: detectLineType(c), manuallySet: false });
        continue;
      }
      if (!(child instanceof HTMLElement)) continue;
      if (child.hasAttribute(SEP_ATTR)) continue;

      const content = child.textContent ?? '';

      if (!child.classList.contains('editor-line')) {
        if (child.tagName === 'DIV') {
          child.className = lineClassName(detectLineType(content));
          const newKey = nextLineKey();
          child.setAttribute(LINE_ATTR, String(newKey));
          claimedKeys.add(newKey);
          lines.push({ key: newKey, content, type: detectLineType(content), manuallySet: false });
        }
        continue;
      }

      const lineKeyStr = child.getAttribute(LINE_ATTR);
      const lineKeyNum = lineKeyStr !== null ? Number(lineKeyStr) : NaN;
      const existingLine = !Number.isNaN(lineKeyNum) ? linesByKey.get(lineKeyNum) : undefined;
      const isDuplicate = !Number.isNaN(lineKeyNum) && claimedKeys.has(lineKeyNum);

      if (existingLine && !isDuplicate) {
        // Reuse stable identity. Type/manuallySet travel with the line; only
        // content tracks the live DOM.
        claimedKeys.add(lineKeyNum);
        lines.push({ ...existingLine, content });
      } else {
        // New line: either no key (browser/paste insertion) or a duplicate
        // key (browser cloned the div on Enter). Assign a fresh identity
        // and rewrite the attribute on the DOM element so subsequent
        // parses match it correctly.
        const newKey = nextLineKey();
        child.setAttribute(LINE_ATTR, String(newKey));
        claimedKeys.add(newKey);
        lines.push({ key: newKey, content, type: detectLineType(content), manuallySet: false });
      }
    }

    result.push({
      key: partKey,
      name: existing?.name,
      acronym: existing?.acronym,
      lines: lines.length > 0 ? lines : [createEmptyLine()],
    });
  }

  if (partDivs.length === 0) {
    const lines: IEditorLine[] = [];
    for (const child of Array.from(editor.childNodes)) {
      if (child instanceof HTMLElement && child.hasAttribute(SEP_ATTR)) continue;
      const c = child.textContent ?? '';
      lines.push({ key: nextLineKey(), content: c, type: detectLineType(c), manuallySet: false });
    }
    const ex = currentParts[0];
    result.push({
      key: ex?.key ?? nextPartKey(),
      name: ex?.name,
      acronym: ex?.acronym,
      lines: lines.length > 0 ? lines : [createEmptyLine()],
    });
  }

  return result;
}

/**
 * Renders the editor DOM from state data.
 */
export function renderEditorDOM(
  editor: HTMLDivElement,
  data: IEditorPart[],
  cursor: { globalIdx: number; offset: number } | null,
  restoreCursorFn: (el: HTMLDivElement, globalIdx: number, offset: number) => void,
): void {
  editor.innerHTML = '';

  for (let pi = 0; pi < data.length; pi++) {
    const part = data[pi];

    const sep = document.createElement('div');
    sep.setAttribute(SEP_ATTR, String(part.key));
    sep.contentEditable = 'false';
    sep.className = 'editor-separator';
    sep.style.height = '28px';
    sep.style.userSelect = 'none';
    editor.appendChild(sep);

    const partDiv = document.createElement('div');
    partDiv.setAttribute(PART_ATTR, String(part.key));
    partDiv.className = 'editor-part';

    for (const line of part.lines) {
      const d = document.createElement('div');
      d.className = lineClassName(line.type);
      d.setAttribute(LINE_ATTR, String(line.key));
      if (line.content) d.textContent = line.content;
      else d.innerHTML = '<br>';
      partDiv.appendChild(d);
    }
    editor.appendChild(partDiv);
  }

  if (data.length === 0) {
    const partDiv = document.createElement('div');
    partDiv.setAttribute(PART_ATTR, '0');
    partDiv.className = 'editor-part';
    const d = document.createElement('div');
    d.className = 'editor-line';
    d.setAttribute(LINE_ATTR, String(nextLineKey()));
    d.innerHTML = '<br>';
    partDiv.appendChild(d);
    editor.appendChild(partDiv);
  }

  if (cursor && (document.activeElement === editor || editor.contains(document.activeElement))) {
    restoreCursorFn(editor, cursor.globalIdx, cursor.offset);
  }
}
