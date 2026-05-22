import type { CanvasData } from './canvas-data.model';

export interface PublishPayload {
  canvasData: CanvasData;
  html: string;          // serialized element HTML (canvas container, body content)
  css: string;           // serialized styles
  js?: string;           // serialized scripts (may be absent)
  fullDocument: string;  // convenience: complete <!DOCTYPE html> string
  meta: CanvasData['meta'];
}
