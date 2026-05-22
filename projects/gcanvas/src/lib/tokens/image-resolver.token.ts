import { InjectionToken } from '@angular/core';
import type { ImageCanvasElement } from '../models/canvas-element.model';

export type ImageResolver = (src: string, element: ImageCanvasElement) => string;

export const IMAGE_RESOLVER_TOKEN = new InjectionToken<ImageResolver>(
  'gc.imageResolver'
);
