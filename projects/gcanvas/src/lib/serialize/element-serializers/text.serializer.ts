import { generateHTML } from '@tiptap/html';
import type { TextCanvasElement } from '../../models/canvas-element.model';
import type { SerializerContext, SerializedFragment } from '../../tokens/element-serializer.token';
import { buildPositionStyle, buildExtraStyles } from '../serializer-utils';

export function serializeTextElement(
  el: TextCanvasElement,
  ctx: SerializerContext
): SerializedFragment {
  const innerHtml = generateHTML(el.content, ctx.tiptapExtensions);
  const positionStyle = buildPositionStyle(el);
  const extraStyle = buildExtraStyles(el.styles);

  const html = `<div style="${positionStyle}overflow:hidden;${extraStyle}">${innerHtml}</div>`;
  return { html };
}
