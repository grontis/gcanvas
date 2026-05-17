import type { CanvasElement } from './canvas-element.model';

export interface CanvasViewport {
  width: number;  // px — canvas is always a fixed-size artboard
  height: number; // px
  backgroundColor?: string;
  maxWidth?: number;                           // optional max-width frame
  padding?: number | { x: number; y: number }; // uniform or asymmetric
}

export interface CanvasData {
  version: number; // start at 1
  viewport: CanvasViewport;
  elements: CanvasElement[];
  meta?: {                                     // page-level metadata
    name?: string;
    slug?: string;
    seoTitle?: string;
    seoDescription?: string;
  };
}

export interface CanvasChangeEvent {
  canvasData: CanvasData;
  changedElementIds: string[]; // affected element(s); empty for viewport-only changes
  changeType: 'move' | 'resize' | 'edit' | 'add' | 'remove' | 'reorder' | 'viewport';
}
