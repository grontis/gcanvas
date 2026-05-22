import type { GenericCanvasElement } from '../../models/canvas-element.model';
import type { SerializerContext, SerializedFragment } from '../../tokens/element-serializer.token';
import { buildPositionStyle, buildExtraStyles } from '../serializer-utils';

export function serializeShapeElement(
  el: GenericCanvasElement,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _ctx: SerializerContext
): SerializedFragment {
  const positionStyle = buildPositionStyle(el);
  const extraStyle = buildExtraStyles(el['styles'] as Record<string, string> | undefined);

  const fill = (el['fill'] as string | undefined) ?? '#d1d5db';
  const borderRadius = (el['borderRadius'] as number | undefined) ?? 0;

  const innerStyle =
    `width:100%;height:100%;` +
    `background-color:${fill};` +
    `border-radius:${borderRadius}px;`;

  const html =
    `<div style="${positionStyle}${extraStyle}">` +
    `<div style="${innerStyle}"></div>` +
    `</div>`;

  return { html };
}
