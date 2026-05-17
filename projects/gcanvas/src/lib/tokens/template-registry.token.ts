import { InjectionToken } from '@angular/core';
import { CanvasData } from '../models/canvas-data.model';

export interface ThumbnailBlock {
  color: string;   // CSS color string, e.g. '#E2E8F0'
  height: number;  // pixel height of the strip in the thumbnail preview
}

export interface TemplateEntry {
  id: string;
  name: string;
  thumbnailBlocks: ThumbnailBlock[];
  data: CanvasData;
}

export const TEMPLATE_REGISTRY_TOKEN = new InjectionToken<TemplateEntry[]>(
  'gc.templateRegistry'
);
