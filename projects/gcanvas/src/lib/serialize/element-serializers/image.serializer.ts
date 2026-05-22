import type { ImageCanvasElement } from '../../models/canvas-element.model';
import type { SerializerContext, SerializedFragment } from '../../tokens/element-serializer.token';
import { buildPositionStyle, buildExtraStyles } from '../serializer-utils';
import { isSafeUrl } from '../../utils/sanitize-url.util';

export function serializeImageElement(
  el: ImageCanvasElement,
  ctx: SerializerContext
): SerializedFragment {
  const positionStyle = buildPositionStyle(el);
  const extraStyle = buildExtraStyles(el.styles);
  const containerStyle = `${positionStyle}${extraStyle}`;

  if (!el.src) {
    // Placeholder matching the Angular component's empty-src behavior
    const html = `<div style="${containerStyle}background:#e5e7eb;display:flex;align-items:center;justify-content:center;" aria-label="${el.alt ?? 'Image placeholder'}"></div>`;
    return { html };
  }

  const resolvedSrc = ctx.resolveImage(el.src, el);

  // SECURITY: Validate resolved URL protocol to block XSS attacks via javascript:,
  // data:, and vbscript: schemes. Both el.src and consumer-supplied resolver output
  // are validated here. Unsafe URLs are treated the same as an empty src.
  if (!isSafeUrl(resolvedSrc)) {
    const html = `<div style="${containerStyle}background:#e5e7eb;display:flex;align-items:center;justify-content:center;" data-gc-placeholder="unsafe-image" aria-label="${el.alt ?? 'Image placeholder'}"></div>`;
    return { html };
  }

  const objectFit = el.objectFit ?? 'cover';
  const objectPosition = el.styles?.['object-position'] ?? 'center center';
  const alt = el.alt ?? '';

  const imgStyle =
    `display:block;width:100%;height:100%;` +
    `object-fit:${objectFit};` +
    `object-position:${objectPosition};`;

  const html =
    `<div style="${containerStyle}">` +
    `<img src="${escapeAttr(resolvedSrc)}" alt="${escapeAttr(alt)}" style="${imgStyle}">` +
    `</div>`;

  return { html };
}

/**
 * Escapes HTML entities in attribute values to prevent HTML injection.
 * Note: handles entity encoding only, not protocol/URL validation.
 * For src attributes, callers must use isSafeUrl() separately.
 */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
