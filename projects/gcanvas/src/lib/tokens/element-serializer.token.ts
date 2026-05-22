import { InjectionToken } from '@angular/core';
import type { AnyExtension } from '@tiptap/core';
import type { CanvasElement, ImageCanvasElement } from '../models/canvas-element.model';

export interface SerializerContext {
  tiptapExtensions: AnyExtension[];
  resolveImage: (src: string, element: ImageCanvasElement) => string;
}

export interface SerializedFragment {
  html: string;     // the element's HTML markup
  css?: string;     // element-scoped CSS (rare; prefer inline styles)
  js?: string;      // optional JS chunk (appended once to <script>)
  head?: string;    // optional <head> injection (e.g. a font link)
}

export interface ElementSerializerEntry {
  type: string;
  serialize(element: CanvasElement, ctx: SerializerContext): SerializedFragment;
}

export const ELEMENT_SERIALIZER_TOKEN = new InjectionToken<ElementSerializerEntry[]>(
  'gc.elementSerializers'
);
