import type { BaseCanvasElement } from '../models/canvas-element.model';

/**
 * Builds the common absolute-position inline style string for a canvas element.
 * Returns a string with a trailing space so extra properties can be appended.
 */
export function buildPositionStyle(el: BaseCanvasElement): string {
  return (
    `position:absolute;` +
    `left:${el.position.x}px;` +
    `top:${el.position.y}px;` +
    `width:${el.size.width}px;` +
    `height:${el.size.height}px;` +
    `z-index:${el.zIndex};`
  );
}

/**
 * Converts a Record<string, string> of extra styles to an inline style suffix.
 * Each key-value becomes "key:value;". Applied last so they override other styles.
 *
 * **Security note:** Style values are emitted verbatim without sanitization.
 * Properties like `background`, `background-image`, and `cursor` accept `url(...)`
 * values, which can carry `javascript:` schemes in some legacy browsers.
 * The library's editor UI does not expose those properties, so the in-library
 * risk is low. Consumers extending the system via custom element registries are
 * responsible for filtering the `styles` dict on elements accepted from untrusted users.
 */
export function buildExtraStyles(styles?: Record<string, string>): string {
  if (!styles) return '';
  return Object.entries(styles)
    .map(([k, v]) => `${k}:${v};`)
    .join('');
}
