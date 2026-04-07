import { RefObject } from "react";
import { SavedSelection } from "@/lib/song-editor-utils";

/**
 * Cursor and selection management for the contentEditable song editor.
 * Returns pure functions (no hooks) that operate on the editor ref.
 */
export function useCursorManagement(editorRef: RefObject<HTMLDivElement | null>) {

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
    restoreCursorOnElement(editor, globalIdx, offset);
  };

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

    const r = document.createRange();
    r.setStart(anchor.node, anchor.offset);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
    sel.extend(focus.node, focus.offset);
  };

  return { saveCursor, restoreCursor, saveSelection, restoreSelection };
}

/**
 * Restores cursor on a given editor element. Used both by the hook and by
 * renderEditorDOM (which doesn't have access to the ref).
 */
export function restoreCursorOnElement(editor: HTMLDivElement, globalIdx: number, offset: number) {
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
}
