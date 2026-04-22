import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { transposeLine, deriveAcronym, isBlockEqual } from "@/lib/songs";
import { SongPartLineType } from "@/types";
import { SongSchema } from "@/types/schemas/song.schema";
import { SongEditorSeparator } from "@/components/app/songs/song-editor-separator";
import {
  IEditorPart,
  SepPos,
  GutterLine,
  SEP_ATTR,
  nextPartKey,
  cycleLineType,
  blocksToEditorParts,
  editorPartsToBlocks,
  lineClassName,
  splitAtDoubleEmpty,
  parseEditorDOM as parseEditorDOMUtil,
  renderEditorDOM as renderEditorDOMUtil,
} from "@/lib/song-editor-utils";
import { useCursorManagement, restoreCursorOnElement } from "@/hooks/useCursorManagement";
import MusicalNoteIcon from "@heroicons/react/24/solid/MusicalNoteIcon";
import ChatBubbleLeftIcon from "@heroicons/react/24/solid/ChatBubbleLeftIcon";
import Bars3BottomLeftIcon from "@heroicons/react/24/solid/Bars3BottomLeftIcon";

interface SongEditorProps {
  form: UseFormReturn<z.infer<typeof SongSchema>>;
  onCursorFocus?: (blockIndex: number, lineIndex: number) => void;
}

export interface SongEditorHandle {
  loadBlocks: (blocks: z.infer<typeof SongSchema>['blocks']) => void;
}

function lineTypeIcon(type: SongPartLineType) {
  switch (type) {
    case 'chords': return <MusicalNoteIcon className="size-3" />;
    case 'comments': return <ChatBubbleLeftIcon className="size-3" />;
    default: return <Bars3BottomLeftIcon className="size-3" />;
  }
}

// ─── Component ──────────────────────────────────────────────────

export const SongEditor = forwardRef<SongEditorHandle, SongEditorProps>(function SongEditor({ form, onCursorFocus }, ref) {
  const { t } = useTranslation("songs");
  const blocks = form.getValues('blocks') ?? [];
  const [parts, setParts] = useState<IEditorPart[]>(() => blocksToEditorParts(blocks));
  const partsRef = useRef(parts);
  partsRef.current = parts;

  const editorRef = useRef<HTMLDivElement>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRendering = useRef(false);

  // ─── Cursor helpers ───────────────────────────────────────────

  const { saveCursor, restoreCursor, saveSelection, restoreSelection } = useCursorManagement(editorRef);

  // ─── Form sync (debounced) ────────────────────────────────────

  const syncToForm = useCallback((updated: IEditorPart[]) => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      form.setValue('blocks', editorPartsToBlocks(updated));
    }, 300);
  }, [form]);

  useEffect(() => () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); }, []);

  // ─── Track focused block and line ──────────────────────────────

  const lastReportedBlock = useRef<number>(-1);
  const lastReportedLine = useRef<number>(-1);

  const detectFocusedPosition = useCallback(() => {
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return;
    if (!editor.contains(sel.anchorNode)) return;

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

    const partDivs = editor.querySelectorAll('.editor-part');
    let blockIndex = -1;
    for (let i = 0; i < partDivs.length; i++) {
      if (partDivs[i] === partNode) { blockIndex = i; break; }
    }
    if (blockIndex < 0) return;

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
    renderEditorDOMUtil(editor, data, cursor, restoreCursorOnElement);
    isRendering.current = false;
  }, [saveCursor]);

  // ─── External handle ──────────────────────────────────────────

  useImperativeHandle(ref, () => ({
    loadBlocks: (blocks) => {
      const newParts = blocksToEditorParts(blocks);
      setParts(newParts);
      renderEditorDOM(newParts);
    },
  }), [renderEditorDOM]);

  // ─── Parse DOM back to state ──────────────────────────────────

  const parseEditorDOM = (): IEditorPart[] => {
    const editor = editorRef.current;
    if (!editor) return partsRef.current;
    return parseEditorDOMUtil(editor, partsRef.current);
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
    const text = e.clipboardData.getData('text/plain');
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();

    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    if (lines.length <= 1) {
      // Single line: insert as plain text node (original behaviour)
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      // Multi-line: find the editor-line we're inside and split it, then
      // insert one editor-line div per pasted line.
      const editor = editorRef.current;
      if (!editor) return;

      // Locate the editor-line element that contains the cursor
      let lineEl: HTMLElement | null = null;
      let node: Node | null = range.startContainer;
      while (node && node !== editor) {
        if (node instanceof HTMLElement && node.classList.contains('editor-line')) {
          lineEl = node;
          break;
        }
        node = node.parentNode;
      }

      if (!lineEl) {
        // Fallback: plain text insert if structure not found
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        // Split the current line at the cursor offset to get before/after text
        const fullText = lineEl.textContent ?? '';
        // Determine cursor offset within the line's text
        let cursorOffset = 0;
        if (range.startContainer === lineEl) {
          // cursor is directly on the element (e.g. before any child)
          cursorOffset = 0;
        } else if (range.startContainer.nodeType === Node.TEXT_NODE && lineEl.contains(range.startContainer)) {
          // Walk text nodes up to the cursor
          let offset = 0;
          for (const child of Array.from(lineEl.childNodes)) {
            if (child === range.startContainer) {
              offset += range.startOffset;
              break;
            }
            offset += child.textContent?.length ?? 0;
          }
          cursorOffset = offset;
        } else {
          cursorOffset = fullText.length;
        }

        const beforeText = fullText.slice(0, cursorOffset);
        const afterText = fullText.slice(cursorOffset);

        // Build the array of new line texts
        const newLineTexts: string[] = [];
        newLineTexts.push(beforeText + lines[0]);
        for (let i = 1; i < lines.length - 1; i++) newLineTexts.push(lines[i]);
        newLineTexts.push(lines[lines.length - 1] + afterText);

        const partDiv = lineEl.parentElement;
        if (!partDiv) return;

        // Create new editor-line divs
        const newDivs: HTMLElement[] = newLineTexts.map((lt) => {
          const d = document.createElement('div');
          d.className = lineEl!.className; // preserve type class for now; handleInput will re-detect
          if (lt) d.textContent = lt;
          else d.innerHTML = '<br>';
          return d;
        });

        // Replace the original line element with the new ones
        const lastDiv = newDivs[newDivs.length - 1];
        lineEl.replaceWith(...newDivs);

        // Place cursor at the end of the last inserted div
        const newRange = document.createRange();
        const lastText = lastDiv.firstChild;
        if (lastText && lastText.nodeType === Node.TEXT_NODE) {
          newRange.setStart(lastText, (lastText as Text).length - afterText.length);
        } else {
          newRange.setStart(lastDiv, 0);
        }
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
    }

    // Dispatch an input event so handleInput runs
    editorRef.current?.dispatchEvent(new InputEvent('input', { bubbles: true }));
  };

  // ─── Keydown: backspace merge at part boundary ────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Backspace' && e.key !== 'Delete') return;
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

    const partDiv = lineNode.closest('.editor-part');
    if (!partDiv) return;

    if (e.key === 'Backspace') {
      const isAtStart = range.startOffset === 0 && (
        range.startContainer === lineNode || range.startContainer === lineNode.firstChild
      );
      if (!isAtStart) return;
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
    }

    if (e.key === 'Delete') {
      const textNode = lineNode.firstChild;
      const textLen = textNode && textNode.nodeType === Node.TEXT_NODE ? (textNode as Text).length : 0;
      const isAtEnd = (range.startContainer === lineNode && range.startOffset === lineNode.childNodes.length)
        || (range.startContainer === textNode && range.startOffset === textLen);
      if (!isAtEnd) return;

      const partLines = partDiv.querySelectorAll('.editor-line');
      if (lineNode !== partLines[partLines.length - 1]) return;

      const sep = partDiv.nextElementSibling;
      if (!sep || !sep.hasAttribute(SEP_ATTR)) return;
      const nextPart = sep.nextElementSibling;
      if (!nextPart || !nextPart.classList.contains('editor-part')) return;

      e.preventDefault();
      const curLineCount = partLines.length;

      for (const l of Array.from(nextPart.querySelectorAll('.editor-line'))) partDiv.appendChild(l);
      sep.remove();
      nextPart.remove();

      const parsed = parseEditorDOM();
      partsRef.current = parsed;
      setParts(parsed);
      syncToForm(parsed);
      forceOverlayUpdate();

      const allLines = editor.querySelectorAll('.editor-line');
      const target = partDiv.querySelectorAll('.editor-line')[curLineCount - 1];
      let idx = 0;
      for (let i = 0; i < allLines.length; i++) {
        if (allLines[i] === target) { idx = i; break; }
      }
      restoreCursor(idx, textLen);
    }
  };

  // ─── Overlay positions ────────────────────────────────────────

  const [sepPositions, setSepPositions] = useState<SepPos[]>([]);
  const [gutterLines, setGutterLines] = useState<GutterLine[]>([]);

  const forceOverlayUpdate = useCallback(() => {
    requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (!editor) return;
      const editorRect = editor.getBoundingClientRect();
      const currentParts = partsRef.current;

      const seps: SepPos[] = [];
      for (const sepEl of Array.from(editor.querySelectorAll<HTMLElement>(`[${SEP_ATTR}]`))) {
        const keyStr = sepEl.getAttribute(SEP_ATTR)!;
        const pi = currentParts.findIndex(p => String(p.key) === keyStr);
        if (pi < 0) continue;
        const rect = sepEl.getBoundingClientRect();
        seps.push({ key: Number(keyStr), partIndex: pi, top: rect.top - editorRect.top });
      }
      setSepPositions(seps);

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
    const newAcronym = name ? deriveAcronym(name) : undefined;
    const changedPart = partsRef.current[partIndex];
    const changedLines = changedPart.lines
      .filter(l => l.content.trim() !== '')
      .map(l => ({ type: l.type, content: l.content }));

    const newParts = partsRef.current.map((p, i) => {
      if (i === partIndex) {
        return { ...p, name: name || undefined, acronym: newAcronym };
      }
      const pLines = p.lines
        .filter(l => l.content.trim() !== '')
        .map(l => ({ type: l.type, content: l.content }));
      if (isBlockEqual({ lines: changedLines }, { lines: pLines })) {
        return { ...p, name: name || undefined, acronym: newAcronym };
      }
      return p;
    });
    partsRef.current = newParts;
    setParts(newParts);
    syncToForm(newParts);
  };

  const handlePartAcronymChange = (partIndex: number, acronym: string) => {
    const newParts = [...partsRef.current];
    newParts[partIndex] = { ...newParts[partIndex], acronym: acronym || undefined };
    partsRef.current = newParts;
    setParts(newParts);
    syncToForm(newParts);
  };

  const handleDuplicatePart = (partIndex: number) => {
    const part = partsRef.current[partIndex];
    const dup: IEditorPart = { key: nextPartKey(), name: part.name, acronym: part.acronym, lines: part.lines.map(l => ({ ...l })) };
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

  const [showFlats, setShowFlats] = useState(() => {
    let sharps = 0;
    let flats = 0;
    for (const part of partsRef.current) {
      for (const line of part.lines) {
        if (line.type !== 'chords') continue;
        sharps += (line.content.match(/[A-G]#/g) ?? []).length;
        flats += (line.content.match(/[A-G]b/g) ?? []).length;
      }
    }
    return flats > sharps;
  });

  const getTargetChordLineIndices = (): Set<number> => {
    const editor = editorRef.current;
    if (!editor) return new Set();

    const sel = window.getSelection();
    const hasSelection = sel && !sel.isCollapsed && sel.rangeCount > 0 && editor.contains(sel.anchorNode);

    const allLineEls = Array.from(editor.querySelectorAll<HTMLElement>('.editor-line'));
    const indices = new Set<number>();

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
    applyToChordLines((line) => transposeLine(line, semitones, showFlats));
  };

  const handleSwapAccidentals = () => {
    const next = !showFlats;
    setShowFlats(next);
    applyToChordLines((line) => transposeLine(line, 0, next), true);
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

  const hasChords = useMemo(
    () => parts.some((p) => p.lines.some((l) => l.type === 'chords')),
    [parts],
  );

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
              className="flex items-center justify-center w-7 h-7 rounded border border-input bg-background hover:bg-accent text-sm font-bold transition-colors cursor-pointer"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleTranspose(-1)}
            >
              -
            </button>
            <button
              type="button"
              title={t('input.transpose.swap')}
              className="flex items-center justify-center h-7 px-2 rounded border border-input bg-background hover:bg-accent text-sm transition-colors cursor-pointer"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSwapAccidentals}
            >
              <span className="font-semibold tracking-tight">{showFlats ? '♭' : '♯'}</span>
            </button>
            <button
              type="button"
              title={t('input.transpose.up')}
              className="flex items-center justify-center w-7 h-7 rounded border border-input bg-background hover:bg-accent text-sm font-bold transition-colors cursor-pointer"
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
                  acronym={parts[sp.partIndex]?.acronym}
                  onNameChange={(name) => handlePartNameChange(sp.partIndex, name)}
                  onAcronymChange={(acronym) => handlePartAcronymChange(sp.partIndex, acronym)}
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
});
