import type { JSONContent } from '@tiptap/core';
import type { CanvasElement, TextCanvasElement, ImageCanvasElement } from '../models/canvas-element.model';

const MAX_LABEL_LENGTH = 24;

/** Recursively extract visible text from a TipTap JSONContent tree. */
function extractText(node: JSONContent, acc: string[]): void {
  if (node.text) {
    acc.push(node.text);
  }
  if (node.content) {
    for (const child of node.content) {
      extractText(child, acc);
      if (acc.join('').length >= MAX_LABEL_LENGTH) return; // early exit
    }
  }
}

/**
 * Returns a human-readable label for a canvas element, truncated to 24 chars.
 * - text elements: first 24 chars of their TipTap content
 * - image elements: alt text or "Image"
 * - other elements: their type string capitalised
 */
export function elementLabel(el: CanvasElement): string {
  if (el.type === 'text') {
    const textEl = el as TextCanvasElement;
    if (!textEl.content) return '';
    const acc: string[] = [];
    extractText(textEl.content, acc);
    const text = acc.join('').trim();
    return text.length > MAX_LABEL_LENGTH
      ? text.slice(0, MAX_LABEL_LENGTH) + '…'
      : text;
  }
  if (el.type === 'image') {
    const imgEl = el as ImageCanvasElement;
    return imgEl.alt ?? 'Image';
  }
  return el.type.charAt(0).toUpperCase() + el.type.slice(1);
}
