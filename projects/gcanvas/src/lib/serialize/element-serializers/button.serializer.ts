import type { GenericCanvasElement } from '../../models/canvas-element.model';
import type { SerializerContext, SerializedFragment } from '../../tokens/element-serializer.token';
import { buildPositionStyle, buildExtraStyles } from '../serializer-utils';

export function serializeButtonElement(
  el: GenericCanvasElement,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _ctx: SerializerContext
): SerializedFragment {
  const positionStyle = buildPositionStyle(el);
  const extraStyle = buildExtraStyles(el['styles'] as Record<string, string> | undefined);
  const label = (el['label'] as string | undefined) ?? 'Button';

  const btnStyle =
    `width:100%;height:100%;border:none;border-radius:4px;` +
    `background:#2563eb;color:#fff;font-size:14px;font-weight:500;cursor:pointer;`;

  const html =
    `<div style="${positionStyle}${extraStyle}">` +
    `<button type="button" style="${btnStyle}">${escapeHtml(label)}</button>` +
    `</div>`;

  return { html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
