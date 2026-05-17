import { InjectionToken } from '@angular/core';
import type { AnyExtension } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Underline } from '@tiptap/extension-underline';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextAlign } from '@tiptap/extension-text-align';
import { Highlight } from '@tiptap/extension-highlight';
import { Link } from '@tiptap/extension-link';
import { FontSize } from '../elements/text-element/font-size.extension';

export const DEFAULT_TIPTAP_EXTENSIONS: AnyExtension[] = [
  StarterKit,
  TextStyle,
  Color,
  Underline,
  FontFamily,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Highlight.configure({ multicolor: true }),
  Link.configure({ openOnClick: false }),
  FontSize,
];

export const TIPTAP_EXTENSIONS_TOKEN = new InjectionToken<AnyExtension[]>(
  'gc.tiptapExtensions'
);
