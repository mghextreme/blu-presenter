import { useCallback, useEffect, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { detectLineType, transposeLine, swapAccidentals } from "@/lib/songs";
import { ISongPart, SongPartLineType } from "@/types";
import { SongSchema } from "@/types/schemas/song.schema";
import { SongEditorSeparator } from "@/components/app/songs/song-editor-separator";
import MusicalNoteIcon from "@heroicons/react/24/solid/MusicalNoteIcon";
import ChatBubbleLeftIcon from "@heroicons/react/24/solid/ChatBubbleLeftIcon";
import Bars3BottomLeftIcon from "@heroicons/react/24/solid/Bars3BottomLeftIcon";

interface SongEditorProps {
  form: UseFormReturn<z.infer<typeof SongSchema>>;
  onCursorFocus?: (blockIndex: number, lineIndex: number) => void;
}

interface IEditorLine {
  content: string;
  type: SongPartLineType;
  manuallySet: boolean;
}

interface IEditorPart {
  key: number;
  lines: IEditorLine[];
  name?: string;
}

const LINE_TYPES: SongPartLineType[] = ['lyrics', 'chords', 'comments'];

function cycleLineType(current: SongPartLineType): SongPartLineType {
  const idx = LINE_TYPES.indexOf(current);
  return LINE_TYPES[(idx + 1) % LINE_TYPES.length];
}

let globalPartKeyCounter = 0;

function blocksToEditorParts(blocks: ISongPart[]): IEditorPart[] {
  if (!blocks || blocks.length === 0) {
    return [{ key: globalPartKeyCounter++, lines: [{ content: '', type: 'lyrics', manuallySet: false }] }];
  }
  return blocks.map((block) => ({
    key: globalPartKeyCounter++,
    name: block.name,
    lines: block.lines.length > 0
      ? block.lines.map((line) => ({ content: line.content, type: line.type, manuallySet: true }))
      : [{ content: '', type: 'lyrics' as SongPartLineType, manuallySet: false }],
  }));
}

function editorPartsToBlocks(parts: IEditorPart[]): ISongPart[] {
  return parts.map((part, ix) => ({
    id: ix,
    name: part.name,
    lines: part.lines
      .filter((l) => l.content.trim() !== '')
      .map((l) => ({ type: l.type, content: l.content })),
  })).filter((b) => b.lines.length > 0);
}

function lineTypeIcon(type: SongPartLineType) {
  switch (type) {
    case 'chords': return <MusicalNoteIcon className="size-3" />;
    case 'comments': return <ChatBubbleLeftIcon className="size-3" />;
    default: return <Bars3BottomLeftIcon className="size-3" />;
  }
}

function lineClassName(type: SongPartLineType): string {
  switch (type) {
    case 'chords': return 'editor-line font-bold text-primary';
    case 'comments': return 'editor-line italic text-green-600 dark:text-green-600';
    default: return 'editor-line';
  }
}

const PART_ATTR = 'data-part-key';
const SEP_ATTR = 'data-separator';

// ─── Component ──────────────────────────────────────────────────

export function SongEditor({ form, onCursorFocus }: SongEditorProps) {
  const { t } = useTranslation("songs");
  const blocks = form.getValues('blocks') ?? [];
  const [parts, setParts] = useState<IEditorPart[]>(() => blocksToEditorParts(blocks));
  const partsRef = useRef(parts);
  partsRef.current = parts;

  const editorRef = useRef<HTMLDivElement>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRendering = useRef(false);

  // ─── Form sync (debounced) ────────────────────────────────────

  const syncToForm = useCallback((updated: IEditorPart[]) => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      form.setValue('blocks', editorPartsToBlocks(updated));
    }, 300);
  }, [form]);

  useEffect(() => () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); }, []);

  // ─── Cursor helpers ───────────────────────────────────────────

  const saveCursor = (): { globalIdx: number; offset: number } | null => {
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    let node: Node | null = range.startContainer;
    const offset = range.startOffset;
    while (node && node !== editor) {
      if (node instanceof HTMLElement && node.classList.contains('editor-line')) break;
      node = node.parentNode;
    }
    if (!node || node === editor) return null;
    const all = editor.querySelectorAll('.editor-line');
    for (let i = 0; i < all.length; i++) {
      if (all[i] === node) return { globalIdx: i, offset };
    }
    return null;
  };

  const restoreCursor = (globalIdx: number, offset: number) => {
    const editor = editorRef.current;
    if (!editor) return;
    const all = editor.querySelectorAll('.editor-line');
    if (globalIdx < 0) globalIdx = 0;
    if (globalIdx >= all.length) globalIdx = all.length - 1;
    if (globalIdx < 0) return;
    const el = all[globalIdx];
    const text = el.firstChild;
    const sel = window.getSelection();
    if (!sel) return;
    const r = document.createRange();
    if (text && text.nodeType === Node.TEXT_NODE) {
      r.setStart(text, Math.min(offset, (text as Text).length));
    } else {
      r.setStart(el, 0);
    }
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
  };

  // Saves/restores a full selection (anchor + focus) by line-index + char offset.
  interface SavedSelection {
    anchorIdx: number; anchorOffset: number;
    focusIdx: number;  focusOffset: number;
  }

  const saveSelection = (): SavedSelection | null => {
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return null;
    const all = editor.querySelectorAll<HTMLElement>('.editor-line');

    const nodeToIdx = (node: Node | null, offset: number): { idx: number; offset: number } | null => {
      let n: Node | null = node;
      while (n && n !== editor) {
        if (n instanceof HTMLElement && n.classList.contains('editor-line')) break;
        n = n.parentNode;
      }
      if (!n || n === editor) return null;
      for (let i = 0; i < all.length; i++) {
        if (all[i] === n) return { idx: i, offset };
      }
      return null;
    };

    const anchor = nodeToIdx(sel.anchorNode, sel.anchorOffset);
    const focus  = nodeToIdx(sel.focusNode,  sel.focusOffset);
    if (!anchor || !focus) return null;
    return { anchorIdx: anchor.idx, anchorOffset: anchor.offset, focusIdx: focus.idx, focusOffset: focus.offset };
  };

  const restoreSelection = (saved: SavedSelection) => {
    const editor = editorRef.current;
    if (!editor) return;
    const all = editor.querySelectorAll<HTMLElement>('.editor-line');
    const sel = window.getSelection();
    if (!sel) return;

    const idxToPoint = (idx: number, offset: number): { node: Node; offset: number } | null => {
      const clampedIdx = Math.max(0, Math.min(idx, all.length - 1));
      const el = all[clampedIdx];
      if (!el) return null;
      const text = el.firstChild;
      if (text && text.nodeType === Node.TEXT_NODE) {
        return { node: text, offset: Math.min(offset, (text as Text).length) };
      }
      return { node: el, offset: 0 };
    };

    const anchor = idxToPoint(saved.anchorIdx, saved.anchorOffset);
    const focus  = idxToPoint(saved.focusIdx,  saved.focusOffset);
    if (!anchor || !focus) return;

    // Set anchor first, then extend to focus — this correctly handles
    // both forward and backward selections without Range ordering issues.
    const r = document.createRange();
    r.setStart(anchor.node, anchor.offset);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
    sel.extend(focus.node, focus.offset);
  };

  // ─── Track focused block and line ──────────────────────────────

  const lastReportedBlock = useRef<number>(-1);
  const lastReportedLine = useRef<number>(-1);

  const detectFocusedPosition = useCallback(() => {
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return;
    if (!editor.contains(sel.anchorNode)) return;

    // Walk up to find the editor-line and editor-part ancestors
    let lineNode: Node | null = sel.anchorNode;
    while (lineNode && lineNode !== editor) {
      if (lineNode instanceof HTMLElement && lineNode.classList.contains('editor-line')) break;
      lineNode = lineNode.parentNode;
    }

    let partNode: Node | null = lineNode;
    while (partNode && partNode !== editor) {
      if (partNode instanceof HTMLElement && partNode.classList.contains('editor-part')) break;
      partNode = partNode.parentNode;
    }
    if (!partNode || partNode === editor || !(partNode instanceof HTMLElement)) return;

    // Find block index
    const partDivs = editor.querySelectorAll('.editor-part');
    let blockIndex = -1;
    for (let i = 0; i < partDivs.length; i++) {
      if (partDivs[i] === partNode) { blockIndex = i; break; }
    }
    if (blockIndex < 0) return;

    // Find line index within the block
    let lineIndex = 0;
    if (lineNode && lineNode !== editor && lineNode instanceof HTMLElement && lineNode.classList.contains('editor-line')) {
      const lineEls = partNode.querySelectorAll('.editor-line');
      for (let i = 0; i < lineEls.length; i++) {
        if (lineEls[i] === lineNode) { lineIndex = i; break; }
      }
    }

    if (lastReportedBlock.current !== blockIndex || lastReportedLine.current !== lineIndex) {
      lastReportedBlock.current = blockIndex;
      lastReportedLine.current = lineIndex;
      onCursorFocus?.(blockIndex, lineIndex);
    }
  }, [onCursorFocus]);

  useEffect(() => {
    const handler = () => detectFocusedPosition();
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, [detectFocusedPosition]);

  // ─── Render DOM from state ────────────────────────────────────

  const renderEditorDOM = useCallback((data: IEditorPart[]) => {
    const editor = editorRef.current;
    if (!editor) return;
    isRendering.current = true;
    const cursor = saveCursor();
    editor.innerHTML = '';

    for (let pi = 0; pi < data.length; pi++) {
      const part = data[pi];

      // Non-editable separator placeholder for every part (including the first).
      // The visual separator is rendered as a React overlay;
      // this placeholder just reserves vertical space & acts as
      // a non-editable boundary the browser cursor can skip over.
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
      d.innerHTML = '<br>';
      partDiv.appendChild(d);
      editor.appendChild(partDiv);
    }

    if (cursor && (document.activeElement === editor || editor.contains(document.activeElement))) {
      restoreCursor(cursor.globalIdx, cursor.offset);
    }
    isRendering.current = false;
  }, []);

  // ─── Parse DOM back to state ──────────────────────────────────

  const parseEditorDOM = (): IEditorPart[] => {
    const editor = editorRef.current;
    if (!editor) return partsRef.current;
    const cur = partsRef.current;
    const result: IEditorPart[] = [];
    const partDivs = editor.querySelectorAll<HTMLElement>('.editor-part');

    for (let pi = 0; pi < partDivs.length; pi++) {
      const partDiv = partDivs[pi];
      const keyStr = partDiv.getAttribute(PART_ATTR);
      const existing = cur.find(p => String(p.key) === keyStr);
      const partKey = existing?.key ?? globalPartKeyCounter++;
      const lines: IEditorLine[] = [];

      // Collect only line elements (editor-line class or bare divs the browser may insert)
      let lineIdx = 0;
      for (const child of Array.from(partDiv.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          const c = child.textContent ?? '';
          lines.push({ content: c, type: detectLineType(c), manuallySet: false });
          lineIdx++;
          continue;
        }
        if (!(child instanceof HTMLElement)) continue;
        if (child.hasAttribute(SEP_ATTR)) continue;

        const content = child.textContent ?? '';

        // Browser may insert bare divs without our class - normalise them
        if (!child.classList.contains('editor-line')) {
          if (child.tagName === 'DIV') {
            child.className = lineClassName(detectLineType(content));
            lines.push({ content, type: detectLineType(content), manuallySet: false });
            lineIdx++;
          }
          continue;
        }

        // For manually-set lines, preserve the user's chosen type as long as
        // the content still matches (guards against index shifts from
        // insertions / deletions above).  For everything else, always
        // re-detect from content so stale DOM classes never win.
        const existingLine = existing?.lines[lineIdx];
        if (existingLine && existingLine.manuallySet && existingLine.content === content) {
          lines.push({ ...existingLine, content });
        } else {
          // The line may have shifted index — try to find it elsewhere
          const shiftedManual = existing?.lines.find(
            (l) => l.manuallySet && l.content === content,
          );
          if (shiftedManual) {
            lines.push({ ...shiftedManual, content });
          } else {
            lines.push({ content, type: detectLineType(content), manuallySet: false });
          }
        }
        lineIdx++;
      }

      result.push({
        key: partKey,
        name: existing?.name,
        lines: lines.length > 0 ? lines : [{ content: '', type: 'lyrics', manuallySet: false }],
      });
    }

    if (partDivs.length === 0) {
      const lines: IEditorLine[] = [];
      for (const child of Array.from(editor.childNodes)) {
        if (child instanceof HTMLElement && child.hasAttribute(SEP_ATTR)) continue;
        const c = child.textContent ?? '';
        lines.push({ content: c, type: detectLineType(c), manuallySet: false });
      }
      const ex = cur[0];
      result.push({
        key: ex?.key ?? globalPartKeyCounter++,
        name: ex?.name,
        lines: lines.length > 0 ? lines : [{ content: '', type: 'lyrics', manuallySet: false }],
      });
    }

    return result;
  };

  // ─── Split parts at double-empty-line ─────────────────────────

  const splitAtDoubleEmpty = (input: IEditorPart[]): IEditorPart[] => {
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
              key: isFirst ? part.key : globalPartKeyCounter++,
              name: isFirst ? part.name : undefined,
              lines: buf.length > 0 ? buf : [{ content: '', type: 'lyrics', manuallySet: false }],
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
        key: isFirst ? part.key : globalPartKeyCounter++,
        name: isFirst ? part.name : undefined,
        lines: buf.length > 0 ? buf : [{ content: '', type: 'lyrics', manuallySet: false }],
      });
    }
    return result;
  };

  // ─── Input handler ────────────────────────────────────────────

  const handleInput = () => {
    if (isRendering.current) return;
    const editor = editorRef.current;
    if (!editor) return;

    // Detect double-empty-line in any part
    let needsSplit = false;
    for (const partDiv of Array.from(editor.querySelectorAll<HTMLElement>('.editor-part'))) {
      const kids = Array.from(partDiv.childNodes);
      for (let i = 0; i < kids.length - 1; i++) {
        if ((kids[i].textContent ?? '').trim() === '' && (kids[i + 1]?.textContent ?? '').trim() === '') {
          needsSplit = true;
          break;
        }
      }
      if (needsSplit) break;
    }

    if (needsSplit) {
      const cursor = saveCursor();
      const parsed = parseEditorDOM();
      const split = splitAtDoubleEmpty(parsed);
      partsRef.current = split;
      setParts(split);
      syncToForm(split);
      requestAnimationFrame(() => {
        renderEditorDOM(split);
        if (cursor) restoreCursor(Math.max(0, cursor.globalIdx - 1), 0);
        editorRef.current?.focus();
        forceOverlayUpdate();
      });
      return;
    }

    // Normal: re-detect types, update in-place
    const parsed = parseEditorDOM();
    partsRef.current = parsed;
    setParts(parsed);
    syncToForm(parsed);

    // Update CSS classes in-place
    const partDivs = editor.querySelectorAll<HTMLElement>('.editor-part');
    for (let pi = 0; pi < partDivs.length; pi++) {
      const lineEls = partDivs[pi].querySelectorAll<HTMLElement>('.editor-line');
      const part = parsed[pi];
      if (!part) continue;
      for (let li = 0; li < lineEls.length && li < part.lines.length; li++) {
        const want = lineClassName(part.lines[li].type);
        if (lineEls[li].className !== want) lineEls[li].className = want;
      }
    }

    forceOverlayUpdate();
  };

  // ─── Paste handler ────────────────────────────────────────────

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
  };

  // ─── Keydown: backspace merge at part boundary ────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Backspace') return;
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return;

    let lineNode: Node | null = range.startContainer;
    while (lineNode && lineNode !== editor) {
      if (lineNode instanceof HTMLElement && lineNode.classList.contains('editor-line')) break;
      lineNode = lineNode.parentNode;
    }
    if (!lineNode || !(lineNode instanceof HTMLElement) || !lineNode.classList.contains('editor-line')) return;

    const isAtStart = range.startOffset === 0 && (
      range.startContainer === lineNode || range.startContainer === lineNode.firstChild
    );
    if (!isAtStart) return;

    const partDiv = lineNode.closest('.editor-part');
    if (!partDiv) return;
    if (lineNode !== partDiv.querySelector('.editor-line')) return;

    const sep = partDiv.previousElementSibling;
    if (!sep || !sep.hasAttribute(SEP_ATTR)) return;
    const prevPart = sep.previousElementSibling;
    if (!prevPart || !prevPart.classList.contains('editor-part')) return;

    e.preventDefault();
    const prevLineCount = prevPart.querySelectorAll('.editor-line').length;

    for (const l of Array.from(partDiv.querySelectorAll('.editor-line'))) prevPart.appendChild(l);
    sep.remove();
    partDiv.remove();

    const parsed = parseEditorDOM();
    partsRef.current = parsed;
    setParts(parsed);
    syncToForm(parsed);
    forceOverlayUpdate();

    const allLines = editor.querySelectorAll('.editor-line');
    const target = prevPart.querySelectorAll('.editor-line')[prevLineCount];
    let idx = 0;
    for (let i = 0; i < allLines.length; i++) {
      if (allLines[i] === target) { idx = i; break; }
    }
    restoreCursor(idx, 0);
  };

  // ─── Overlay positions ────────────────────────────────────────
  // Separator overlays and gutter buttons are positioned using
  // measurements from the contentEditable DOM.

  interface SepPos { key: number; partIndex: number; top: number }
  interface GutterLine { partIndex: number; lineIndex: number; line: IEditorLine; top: number; height: number }

  const [sepPositions, setSepPositions] = useState<SepPos[]>([]);
  const [gutterLines, setGutterLines] = useState<GutterLine[]>([]);

  const forceOverlayUpdate = useCallback(() => {
    requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (!editor) return;
      const editorRect = editor.getBoundingClientRect();
      const currentParts = partsRef.current;

      // Separator positions — all parts have placeholder divs now
      const seps: SepPos[] = [];
      for (const sepEl of Array.from(editor.querySelectorAll<HTMLElement>(`[${SEP_ATTR}]`))) {
        const keyStr = sepEl.getAttribute(SEP_ATTR)!;
        const pi = currentParts.findIndex(p => String(p.key) === keyStr);
        if (pi < 0) continue;
        const rect = sepEl.getBoundingClientRect();
        seps.push({ key: Number(keyStr), partIndex: pi, top: rect.top - editorRect.top });
      }
      setSepPositions(seps);

      // Gutter lines
      const gLines: GutterLine[] = [];
      const partDivs = editor.querySelectorAll<HTMLElement>('.editor-part');
      for (let pi = 0; pi < partDivs.length && pi < currentParts.length; pi++) {
        const lineEls = partDivs[pi].querySelectorAll<HTMLElement>('.editor-line');
        for (let li = 0; li < lineEls.length && li < currentParts[pi].lines.length; li++) {
          const rect = lineEls[li].getBoundingClientRect();
          gLines.push({
            partIndex: pi, lineIndex: li,
            line: currentParts[pi].lines[li],
            top: rect.top - editorRect.top,
            height: rect.height,
          });
        }
      }
      setGutterLines(gLines);
    });
  }, []);

  // Observe editor mutations and resize for overlay sync
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const update = () => forceOverlayUpdate();
    const mo = new MutationObserver(update);
    mo.observe(editor, { childList: true, subtree: true, characterData: true });
    const ro = new ResizeObserver(update);
    ro.observe(editor);
    update();
    return () => { mo.disconnect(); ro.disconnect(); };
  }, [forceOverlayUpdate]);

  // ─── Line type toggle ─────────────────────────────────────────

  const toggleLineType = (partIndex: number, lineIndex: number) => {
    const newParts = partsRef.current.map((p, pi) =>
      pi === partIndex
        ? { ...p, lines: p.lines.map((l, li) => li === lineIndex ? { ...l, type: cycleLineType(l.type), manuallySet: true } : l) }
        : p
    );
    partsRef.current = newParts;
    setParts(newParts);
    syncToForm(newParts);
    const editor = editorRef.current;
    if (editor) {
      const partDiv = editor.querySelectorAll('.editor-part')[partIndex];
      if (partDiv) {
        const lineEl = partDiv.querySelectorAll('.editor-line')[lineIndex] as HTMLElement | undefined;
        if (lineEl) lineEl.className = lineClassName(newParts[partIndex].lines[lineIndex].type);
      }
    }
    forceOverlayUpdate();
  };

  // ─── Part actions ─────────────────────────────────────────────

  const handlePartNameChange = (partIndex: number, name: string) => {
    const newParts = [...partsRef.current];
    newParts[partIndex] = { ...newParts[partIndex], name: name || undefined };
    partsRef.current = newParts;
    setParts(newParts);
    syncToForm(newParts);
  };

  const handleDuplicatePart = (partIndex: number) => {
    const part = partsRef.current[partIndex];
    const dup: IEditorPart = { key: globalPartKeyCounter++, name: part.name, lines: part.lines.map(l => ({ ...l })) };
    const newParts = [...partsRef.current];
    newParts.splice(partIndex + 1, 0, dup);
    partsRef.current = newParts;
    setParts(newParts);
    syncToForm(newParts);
    requestAnimationFrame(() => { renderEditorDOM(newParts); forceOverlayUpdate(); });
  };

  const handleRemovePart = (partIndex: number) => {
    if (partsRef.current.length <= 1) return;
    const newParts = partsRef.current.filter((_, i) => i !== partIndex);
    partsRef.current = newParts;
    setParts(newParts);
    syncToForm(newParts);
    requestAnimationFrame(() => { renderEditorDOM(newParts); forceOverlayUpdate(); });
  };

  // ─── Transpose / swap-accidentals ────────────────────────────

  const [showFlats, setShowFlats] = useState(false);

  /** Returns the set of chord-line global indices that are in scope for the operation.
   *  If the editor has a non-collapsed selection, only lines overlapping that selection
   *  are included; otherwise all chord lines are included. */
  const getTargetChordLineIndices = (): Set<number> => {
    const editor = editorRef.current;
    if (!editor) return new Set();

    const sel = window.getSelection();
    const hasSelection = sel && !sel.isCollapsed && sel.rangeCount > 0 && editor.contains(sel.anchorNode);

    const allLineEls = Array.from(editor.querySelectorAll<HTMLElement>('.editor-line'));
    const indices = new Set<number>();

    // Build a flat list mirroring partsRef so we can check types by global index
    const flatLines: { type: SongPartLineType }[] = [];
    for (const part of partsRef.current) {
      for (const line of part.lines) {
        flatLines.push(line);
      }
    }

    if (hasSelection) {
      const range = sel!.getRangeAt(0);
      allLineEls.forEach((el, i) => {
        if (flatLines[i]?.type !== 'chords') return;
        // Check if this line element intersects the selection range
        const elRange = document.createRange();
        elRange.selectNode(el);
        const comparison = range.compareBoundaryPoints(Range.END_TO_START, elRange);
        const comparison2 = range.compareBoundaryPoints(Range.START_TO_END, elRange);
        if (comparison <= 0 && comparison2 >= 0) {
          indices.add(i);
        }
      });
    } else {
      allLineEls.forEach((_, i) => {
        if (flatLines[i]?.type === 'chords') indices.add(i);
      });
    }

    return indices;
  };

  const applyToChordLines = (transform: (line: string) => string, allLines = false) => {
    const targetIndices = allLines
      ? (() => {
          let i = 0;
          const set = new Set<number>();
          for (const part of partsRef.current)
            for (const line of part.lines) { if (line.type === 'chords') set.add(i); i++; }
          return set;
        })()
      : getTargetChordLineIndices();
    if (targetIndices.size === 0) return;

    // Save selection before re-rendering so we can restore it after
    const savedSel = saveSelection();

    let globalIdx = 0;
    const newParts = partsRef.current.map((part) => ({
      ...part,
      lines: part.lines.map((line) => {
        const idx = globalIdx++;
        if (!targetIndices.has(idx)) return line;
        return { ...line, content: transform(line.content) };
      }),
    }));

    partsRef.current = newParts;
    setParts(newParts);
    syncToForm(newParts);
    requestAnimationFrame(() => {
      renderEditorDOM(newParts);
      forceOverlayUpdate();
      if (savedSel) restoreSelection(savedSel);
    });
  };

  const handleTranspose = (semitones: number) => {
    const useFlats = semitones < 0;
    setShowFlats(useFlats);
    applyToChordLines((line) => transposeLine(line, semitones, useFlats));
  };

  const handleSwapAccidentals = () => {
    const next = !showFlats;
    setShowFlats(next);
    applyToChordLines((line) => swapAccidentals(line), true);
  };

  // ─── Initial render ───────────────────────────────────────────

  const hasRendered = useRef(false);
  useEffect(() => {
    if (!hasRendered.current && editorRef.current) {
      hasRendered.current = true;
      renderEditorDOM(parts);
    }
  }, [parts, renderEditorDOM]);

  // ─── Render ────────────────────────────────────────────────────

  const hasChords = parts.some((p) => p.lines.some((l) => l.type === 'chords'));

  return (
    <div className="flex flex-col gap-0">
      {/* Header: "Parts" label + transpose buttons */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium leading-none">{t('input.parts')}</span>
        {hasChords && (
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              title={t('input.transpose.down')}
              className="flex items-center justify-center w-7 h-7 rounded border border-input bg-background hover:bg-accent text-sm font-bold transition-colors"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleTranspose(-1)}
            >
              -
            </button>
            <button
              type="button"
              title={t('input.transpose.swap')}
              className="flex items-center justify-center h-7 px-2 rounded border border-input bg-background hover:bg-accent text-sm transition-colors"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSwapAccidentals}
            >
              <span className="font-semibold tracking-tight">{showFlats ? '♭' : '♯'}</span>
            </button>
            <button
              type="button"
              title={t('input.transpose.up')}
              className="flex items-center justify-center w-7 h-7 rounded border border-input bg-background hover:bg-accent text-sm font-bold transition-colors"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleTranspose(1)}
            >
              +
            </button>
          </div>
        )}
      </div>
      <div className="relative">
        {/* Main layout: gutter + editor */}
        <div className="flex items-stretch">
          {/* Gutter - absolutely positioned line type buttons */}
          <div className="relative border border-r-0 border-input rounded-l-md shadow-xs dark:bg-input/10 w-8 flex-shrink-0">
            {gutterLines.map((gl) => (
              <button
                key={`g-${gl.partIndex}-${gl.lineIndex}`}
                type="button"
                title={t(`input.lineType.${gl.line.type}`)}
                className={cn(
                  "absolute left-0 flex items-center justify-center w-8 cursor-pointer transition-colors",
                  "hover:bg-accent text-muted-foreground hover:text-accent-foreground",
                  gl.line.manuallySet && "text-foreground",
                  gl.line.type === 'chords' && "text-primary",
                  gl.line.type === 'comments' && "text-green-600 dark:text-green-600",
                )}
                style={{ top: gl.top, height: gl.height }}
                onClick={() => toggleLineType(gl.partIndex, gl.lineIndex)}
              >
                {lineTypeIcon(gl.line.type)}
              </button>
            ))}
          </div>

          {/* Single contentEditable + separator overlays */}
          <div className="flex-1 relative min-w-0">
            {/* Separator overlays inside editor area (all parts) */}
            {sepPositions.map((sp) => (
              <div
                key={`sep-${sp.key}`}
                className="absolute left-0 right-0 z-10 pointer-events-auto"
                style={{ top: sp.top }}
              >
                <SongEditorSeparator
                  name={parts[sp.partIndex]?.name}
                  onNameChange={(name) => handlePartNameChange(sp.partIndex, name)}
                  onDuplicate={() => handleDuplicatePart(sp.partIndex)}
                  onRemove={() => handleRemovePart(sp.partIndex)}
                  showRemove={parts.length > 1}
                />
              </div>
            ))}

            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              className={cn(
                "font-source-code-pro text-sm leading-6 outline-none whitespace-pre-wrap",
                "px-3 py-2",
                "border border-l-0 border-input rounded-r-md shadow-xs dark:bg-input/30",
                "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
                "[&_.editor-line]:min-h-[1.5rem]",
                "[&_.editor-separator]:cursor-default",
              )}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
