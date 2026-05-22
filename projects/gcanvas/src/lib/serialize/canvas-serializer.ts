import type { CanvasData, CanvasViewport } from '../models/canvas-data.model';
import type { ElementSerializerEntry, SerializerContext } from '../tokens/element-serializer.token';

export interface SerializedCanvas {
  html: string;
  css: string;
  js?: string;
  head?: string;
}

const BASE_RESET = `*, *::before, *::after { box-sizing: border-box; } body { margin: 0; }`;

/**
 * Build padding CSS value from the viewport's padding field.
 */
function buildPaddingCss(padding: CanvasViewport['padding']): string {
  if (padding === undefined || padding === null) return '';
  if (typeof padding === 'number') return `padding:${padding}px;`;
  return `padding:${padding.y}px ${padding.x}px;`;
}

/**
 * Pure function: serializes CanvasData into { html, css, js?, head? }.
 * Elements with visible === false are skipped.
 * Unknown element types emit an HTML comment instead of crashing.
 */
export function serializeCanvas(
  data: CanvasData,
  serializers: ElementSerializerEntry[],
  ctx: SerializerContext
): SerializedCanvas {
  const { viewport } = data;

  const cssFragments: string[] = [];
  const jsFragments: string[] = [];
  const headFragments: string[] = [];
  const elementHtmlParts: string[] = [];

  for (const element of data.elements) {
    // Skip hidden elements
    if (element.visible === false) continue;

    // Resolve serializer — last matching entry wins (Angular multi-provider order)
    const entry = [...serializers].reverse().find(s => s.type === element.type);

    if (!entry) {
      elementHtmlParts.push(`<!-- unknown element type: ${element.type} -->`);
      continue;
    }

    const fragment = entry.serialize(element, ctx);
    elementHtmlParts.push(fragment.html);

    if (fragment.css && !cssFragments.includes(fragment.css)) {
      cssFragments.push(fragment.css);
    }
    if (fragment.js && !jsFragments.includes(fragment.js)) {
      jsFragments.push(fragment.js);
    }
    if (fragment.head && !headFragments.includes(fragment.head)) {
      headFragments.push(fragment.head);
    }
  }

  const canvasStyle =
    `position:relative;` +
    `width:${viewport.width}px;` +
    `height:${viewport.height}px;` +
    `background-color:${viewport.backgroundColor ?? '#fff'};` +
    `overflow:hidden;` +
    `box-sizing:border-box;` +
    buildPaddingCss(viewport.padding);

  const html = `<div class="gc-canvas-export" style="${canvasStyle}">${elementHtmlParts.join('')}</div>`;
  const css = cssFragments.join('\n');
  const js = jsFragments.length > 0 ? jsFragments.join('\n') : undefined;
  const head = headFragments.length > 0 ? headFragments.join('\n') : undefined;

  return { html, css, js, head };
}

/**
 * Wraps the serialized canvas output into a complete <!DOCTYPE html> document.
 */
export function toHtmlDocument(
  payload: SerializedCanvas,
  meta?: CanvasData['meta']
): string {
  const title = escapeHtml(meta?.seoTitle ?? '');
  const description = escapeHtml(meta?.seoDescription ?? '');
  const styleBlock = `<style>${BASE_RESET}${payload.css ? '\n' + payload.css : ''}</style>`;
  const headExtra = payload.head ? `\n${payload.head}` : '';

  // Escape </script> inside the JS block to prevent premature tag close.
  // Replace "</script>" with "<\/script>" — the backslash prevents HTML parser from matching
  // the end-tag pattern while remaining valid in JS (\/  === / in JS string context).
  const scriptBlock = payload.js
    ? `\n<script>${payload.js.replace(/<\/script>/gi, '<\\/script>')}</script>`
    : '';

  return (
    `<!DOCTYPE html>` +
    `<html lang="en">` +
    `<head>` +
    `<meta charset="UTF-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>${title}</title>` +
    `<meta name="description" content="${description}">` +
    styleBlock +
    headExtra +
    `</head>` +
    `<body style="margin:0">` +
    payload.html +
    scriptBlock +
    `</body>` +
    `</html>`
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
