import { InjectionToken } from '@angular/core';

export interface PaletteEntry {
  /** Matches ToolId and the element type string used in the registry. */
  toolId: string;
  /** Human-readable label shown below the tile icon. */
  label: string;
  /** Inline SVG string rendered via [innerHTML]. Widened to TemplateRef in a later phase. */
  icon: string;
  /**
   * Default size for newly created elements of this type.
   * Used by both click-to-add and drag-from-palette.
   */
  defaultSize: { width: number; height: number };
  /**
   * Category for grouping in the library modal nav.
   * Use 'content', 'media', or 'layout' for the built-in categories;
   * any string value is accepted for consumer-defined categories.
   */
  category?: 'content' | 'media' | 'layout' | string;
  /** Optional description shown in the library modal detail pane. */
  description?: string;
}

export const COMPONENT_PALETTE_TOKEN = new InjectionToken<PaletteEntry[]>(
  'gc.componentPalette'
);
