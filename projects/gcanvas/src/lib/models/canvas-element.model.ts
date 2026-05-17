import type { JSONContent } from '@tiptap/core';

export type BuiltInElementType = 'text' | 'image';
// Plugin element types use string — keep CanvasElement as a discriminated union
// and provide a GenericCanvasElement for plugin authors.

export interface ElementPosition { x: number; y: number; }
export interface ElementSize { width: number; height: number; }

export interface BaseCanvasElement {
  id: string;
  type: string;
  position: ElementPosition;
  size: ElementSize;
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
  lockAspectRatio?: boolean;
  styles?: Record<string, string>;
}

export interface TextCanvasElement extends BaseCanvasElement {
  type: 'text';
  content: JSONContent; // TipTap JSON document — serialization is the consumer's responsibility
}

export interface ImageCanvasElement extends BaseCanvasElement {
  type: 'image';
  src: string;
  alt?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
}

/** For plugin element types not covered by the built-in union. */
export interface GenericCanvasElement extends BaseCanvasElement {
  [key: string]: unknown;
}

export type CanvasElement = TextCanvasElement | ImageCanvasElement | GenericCanvasElement;
