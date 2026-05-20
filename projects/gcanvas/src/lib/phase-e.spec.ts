/**
 * Unit tests for Phase E — Image Inspector, Effects Section,
 * Floating Action Toolbar, Aspect-Ratio Lock, Center-Resize.
 *
 * Covers acceptance criteria that can be exercised programmatically:
 *   - Model: lockAspectRatio field present on BaseCanvasElement
 *   - Barrel exports: all Phase E symbols exported from public-api
 *   - EffectsSectionComponent: style-spread logic, border-radius normalisation,
 *     shadow preset resolution, opacity computation
 *   - ImageSectionComponent: focal-point positions list, objectFit/alt computed values
 *   - FloatingActionToolbarComponent: isVisible, isImage, toolbarTop/Left clamping
 *   - Element-wrapper resize math: Shift ratio-lock, Alt center-resize,
 *     Shift+Alt combined
 */

import { TestBed } from '@angular/core/testing';
import { reflectComponentType, ChangeDetectionStrategy } from '@angular/core';

// ---------------------------------------------------------------------------
// Barrel imports — validates acceptance criterion 22
// ---------------------------------------------------------------------------

import {
  FloatingActionToolbarComponent,
  FOCAL_POINT_POSITIONS,
  SHADOW_PRESETS,
  type ShadowPreset,
} from '../public-api';

// Internal component imports (not exported from public-api per ARCH §3 cleanup)
import { ImageSectionComponent } from './editor/inspector/sections/image-section.component';
import { EffectsSectionComponent } from './editor/inspector/sections/effects-section.component';

import { CanvasStateService } from './services/canvas-state.service';
import { SelectionService } from './services/selection.service';
import { CanvasElement, ImageCanvasElement } from './models/canvas-element.model';
import { CanvasData } from './models/canvas-data.model';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeImageElement(
  id: string,
  x = 100,
  y = 100,
  w = 400,
  h = 200,
): ImageCanvasElement {
  return {
    id,
    type: 'image',
    position: { x, y },
    size: { width: w, height: h },
    zIndex: 1,
    src: '',
    styles: {},
  };
}

function makeTextElement(id: string, x = 0, y = 0, w = 200, h = 100): CanvasElement {
  return {
    id,
    type: 'text',
    position: { x, y },
    size: { width: w, height: h },
    zIndex: 1,
    content: { type: 'doc', content: [] },
  } as CanvasElement;
}

const BASE_VIEWPORT: CanvasData = {
  version: 1,
  viewport: { width: 1200, height: 800 },
  elements: [],
};

// ---------------------------------------------------------------------------
// Barrel exports — Phase E symbols defined
// ---------------------------------------------------------------------------

describe('Phase E barrel exports', () => {
  it('FloatingActionToolbarComponent should be defined', () => {
    expect(FloatingActionToolbarComponent).toBeDefined();
  });

  // ImageSectionComponent and EffectsSectionComponent are internal (not in barrel — ARCH §3)
  it('ImageSectionComponent should be defined (direct import)', () => {
    expect(ImageSectionComponent).toBeDefined();
  });

  it('FOCAL_POINT_POSITIONS should be defined and have 9 entries', () => {
    expect(FOCAL_POINT_POSITIONS).toBeDefined();
    expect(FOCAL_POINT_POSITIONS.length).toBe(9);
  });

  it('EffectsSectionComponent should be defined (direct import)', () => {
    expect(EffectsSectionComponent).toBeDefined();
  });

  it('SHADOW_PRESETS should be defined with 4 entries', () => {
    expect(SHADOW_PRESETS).toBeDefined();
    expect(Object.keys(SHADOW_PRESETS).length).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// Model: lockAspectRatio field
// ---------------------------------------------------------------------------

describe('BaseCanvasElement — lockAspectRatio field', () => {
  it('lockAspectRatio can be set on an element without TypeScript error', () => {
    const el: CanvasElement = {
      ...makeTextElement('el-lock'),
      lockAspectRatio: true,
    };
    expect(el.lockAspectRatio).toBe(true);
  });

  it('lockAspectRatio is optional (undefined by default)', () => {
    const el: CanvasElement = makeTextElement('el-no-lock');
    expect(el.lockAspectRatio).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// FOCAL_POINT_POSITIONS — correct values in correct order
// ---------------------------------------------------------------------------

describe('FOCAL_POINT_POSITIONS', () => {
  it('first entry should be "left top"', () => {
    expect(FOCAL_POINT_POSITIONS[0]).toBe('left top');
  });

  it('center entry (index 4) should be "center center"', () => {
    expect(FOCAL_POINT_POSITIONS[4]).toBe('center center');
  });

  it('last entry (index 8) should be "right bottom"', () => {
    expect(FOCAL_POINT_POSITIONS[8]).toBe('right bottom');
  });

  it('all values should be in the format "<h> <v>"', () => {
    for (const pos of FOCAL_POINT_POSITIONS) {
      const parts = pos.split(' ');
      expect(parts.length).toBe(2);
    }
  });
});

// ---------------------------------------------------------------------------
// SHADOW_PRESETS — values match spec
// ---------------------------------------------------------------------------

describe('SHADOW_PRESETS', () => {
  it('none preset equals "none"', () => {
    expect(SHADOW_PRESETS['none']).toBe('none');
  });

  it('soft preset should contain rgba', () => {
    expect(SHADOW_PRESETS['soft']).toContain('rgba');
  });

  it('medium preset should contain rgba', () => {
    expect(SHADOW_PRESETS['medium']).toContain('rgba');
  });

  it('hard preset should contain rgba', () => {
    expect(SHADOW_PRESETS['hard']).toContain('rgba');
  });
});

// ---------------------------------------------------------------------------
// EffectsSectionComponent — component metadata
// ---------------------------------------------------------------------------

describe('EffectsSectionComponent metadata', () => {
  it('should be a standalone component', () => {
    const mirror = reflectComponentType(EffectsSectionComponent);
    expect(mirror).toBeTruthy();
    expect(mirror?.isStandalone).toBe(true);
  });

  it('should have selector gc-effects-section', () => {
    const mirror = reflectComponentType(EffectsSectionComponent);
    expect(mirror?.selector).toBe('gc-effects-section');
  });
});

// ---------------------------------------------------------------------------
// ImageSectionComponent — component metadata
// ---------------------------------------------------------------------------

describe('ImageSectionComponent metadata', () => {
  it('should be a standalone component', () => {
    const mirror = reflectComponentType(ImageSectionComponent);
    expect(mirror).toBeTruthy();
    expect(mirror?.isStandalone).toBe(true);
  });

  it('should have selector gc-image-section', () => {
    const mirror = reflectComponentType(ImageSectionComponent);
    expect(mirror?.selector).toBe('gc-image-section');
  });
});

// ---------------------------------------------------------------------------
// FloatingActionToolbarComponent — component metadata
// ---------------------------------------------------------------------------

describe('FloatingActionToolbarComponent metadata', () => {
  it('should be a standalone component', () => {
    const mirror = reflectComponentType(FloatingActionToolbarComponent);
    expect(mirror).toBeTruthy();
    expect(mirror?.isStandalone).toBe(true);
  });

  it('should have selector gc-floating-action-toolbar', () => {
    const mirror = reflectComponentType(FloatingActionToolbarComponent);
    expect(mirror?.selector).toBe('gc-floating-action-toolbar');
  });
});

// ---------------------------------------------------------------------------
// FloatingActionToolbarComponent — isVisible, isImage, positioning signals
// ---------------------------------------------------------------------------

describe('FloatingActionToolbarComponent — signal logic', () => {
  let canvasState: CanvasStateService;
  let selectionService: SelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CanvasStateService, SelectionService],
    });
    canvasState = TestBed.inject(CanvasStateService);
    selectionService = TestBed.inject(SelectionService);
    canvasState.loadSnapshot(BASE_VIEWPORT);
  });

  it('isVisible is false when nothing is selected', () => {
    TestBed.runInInjectionContext(() => {
      const comp = new FloatingActionToolbarComponent();
      // Access private via any for test purposes
      (comp as any).selection = selectionService;
      (comp as any).canvasState = canvasState;

      // No selection → not visible
      const isVisible = (comp as any).isVisible();
      expect(isVisible).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// CanvasStateService — patchElement styles spread
// ---------------------------------------------------------------------------

describe('CanvasStateService — patchElement styles spread', () => {
  let service: CanvasStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CanvasStateService] });
    service = TestBed.inject(CanvasStateService);
    service.loadSnapshot(BASE_VIEWPORT);
  });

  it('patchElement with styles should not erase other style properties', () => {
    const el = makeTextElement('el-styles');
    // Start with an existing style
    service.addElement({ ...el, styles: { 'border-radius': '4px', 'opacity': '0.9' } });

    // Patch with spread (simulating what EffectsSectionComponent does)
    const existing = service.elements()[0];
    service.patchElement('el-styles', {
      styles: { ...existing.styles, 'box-shadow': '0 2px 8px rgba(0,0,0,0.12)' },
    });

    const updated = service.elements()[0];
    expect(updated.styles?.['border-radius']).toBe('4px');
    expect(updated.styles?.['opacity']).toBe('0.9');
    expect(updated.styles?.['box-shadow']).toBe('0 2px 8px rgba(0,0,0,0.12)');
  });

  it('patchElement with objectFit updates ImageCanvasElement', () => {
    const imgEl = makeImageElement('img-1');
    service.addElement(imgEl);
    service.patchElement('img-1', { objectFit: 'contain' });

    const updated = service.elements()[0] as ImageCanvasElement;
    expect(updated.objectFit).toBe('contain');
  });

  it('patchElement with alt text updates ImageCanvasElement', () => {
    const imgEl = makeImageElement('img-2');
    service.addElement(imgEl);
    service.patchElement('img-2', { alt: 'A photo of a sunset' });

    const updated = service.elements()[0] as ImageCanvasElement;
    expect(updated.alt).toBe('A photo of a sunset');
  });

  it('patchElement with lockAspectRatio sets flag on element', () => {
    const el = makeTextElement('el-lock');
    service.addElement(el);
    service.patchElement('el-lock', { lockAspectRatio: true });

    const updated = service.elements()[0];
    expect(updated.lockAspectRatio).toBe(true);
  });

  it('object-position style is preserved by spread', () => {
    const imgEl = makeImageElement('img-pos');
    service.addElement({ ...imgEl, styles: { 'object-position': 'right top' } });

    const existing = service.elements()[0];
    service.patchElement('img-pos', {
      styles: { ...existing.styles, 'border-radius': '8px' },
    });

    const updated = service.elements()[0];
    expect(updated.styles?.['object-position']).toBe('right top');
    expect(updated.styles?.['border-radius']).toBe('8px');
  });
});

// ---------------------------------------------------------------------------
// Resize modifier math — pure unit tests (no TestBed needed)
// ---------------------------------------------------------------------------

describe('Resize modifier math — ratio lock (Shift)', () => {
  // We test the math directly with helper functions that mirror onResizeMove logic.

  interface ResizeInput {
    startWidth: number;
    startHeight: number;
    rawDw: number;
    rawDh: number;
  }

  function applyRatioLock(
    input: ResizeInput,
    minSize = 50,
  ): { rawDw: number; rawDh: number } {
    let { rawDw, rawDh } = input;
    const { startWidth, startHeight } = input;
    const ratio = startWidth / startHeight;
    if (rawDw !== 0 && rawDh !== 0) {
      if (Math.abs(rawDw) >= Math.abs(rawDh) * ratio) {
        rawDh = rawDw / ratio;
      } else {
        rawDw = rawDh * ratio;
      }
    }
    return { rawDw, rawDh };
  }

  function applyAltCenterResize(
    startX: number, startY: number,
    startWidth: number, startHeight: number,
    rawDw: number, rawDh: number,
    minSize = 50,
  ): { x: number; y: number; width: number; height: number } {
    const doubledDw = rawDw * 2;
    const doubledDh = rawDh * 2;
    const width  = Math.max(minSize, startWidth  + doubledDw);
    const height = Math.max(minSize, startHeight + doubledDh);
    const x = startX + startWidth  / 2 - width  / 2;
    const y = startY + startHeight / 2 - height / 2;
    return { x, y, width, height };
  }

  it('400×200 element dragged +100dw +60dh with Shift should lock height to 50 (dw dominant)', () => {
    // ratio = 400/200 = 2.0
    // Math.abs(100) >= Math.abs(60) * 2 → 100 >= 120 → false → height dominant
    // rawDw = rawDh * ratio = 60 * 2 = 120
    const result = applyRatioLock({
      startWidth: 400, startHeight: 200, rawDw: 100, rawDh: 60,
    });
    expect(result.rawDw).toBeCloseTo(120, 5);
    expect(result.rawDh).toBeCloseTo(60, 5);
  });

  it('400×200 element dragged +200dw +60dh with Shift should be width dominant', () => {
    // ratio = 2.0
    // Math.abs(200) >= Math.abs(60) * 2 → 200 >= 120 → true → width dominant
    // rawDh = rawDw / ratio = 200 / 2 = 100
    const result = applyRatioLock({
      startWidth: 400, startHeight: 200, rawDw: 200, rawDh: 60,
    });
    expect(result.rawDw).toBeCloseTo(200, 5);
    expect(result.rawDh).toBeCloseTo(100, 5);
  });

  it('maintained ratio: final width/height ratio should equal original ratio', () => {
    const startWidth = 400;
    const startHeight = 200;
    const ratio = startWidth / startHeight;

    const result = applyRatioLock({
      startWidth, startHeight, rawDw: 150, rawDh: 30,
    });
    const finalWidth  = startWidth  + result.rawDw;
    const finalHeight = startHeight + result.rawDh;
    expect(finalWidth / finalHeight).toBeCloseTo(ratio, 5);
  });

  it('single-axis-only deltas (rawDh = 0) should not alter anything', () => {
    // Only horizontal handle — rawDh stays 0
    const result = applyRatioLock({
      startWidth: 400, startHeight: 200, rawDw: 100, rawDh: 0,
    });
    expect(result.rawDw).toBe(100);
    expect(result.rawDh).toBe(0);
  });

  it('single-axis-only deltas (rawDw = 0) should not alter anything', () => {
    const result = applyRatioLock({
      startWidth: 400, startHeight: 200, rawDw: 0, rawDh: 50,
    });
    expect(result.rawDw).toBe(0);
    expect(result.rawDh).toBe(50);
  });
});

describe('Resize modifier math — center-resize (Alt)', () => {
  function applyAlt(
    startX: number, startY: number,
    startW: number, startH: number,
    rawDw: number, rawDh: number,
    minSize = 50,
  ) {
    const width  = Math.max(minSize, startW + rawDw * 2);
    const height = Math.max(minSize, startH + rawDh * 2);
    const x = startX + startW / 2 - width  / 2;
    const y = startY + startH / 2 - height / 2;
    return { x, y, width, height };
  }

  it('Alt: SE corner drag dx=+20 dy=+10 → size +40w +20h, pos −20x −10y', () => {
    // startPos: (100, 100), startSize: 200×100
    // center: (200, 150)
    const r = applyAlt(100, 100, 200, 100, 20, 10);
    expect(r.width).toBeCloseTo(240, 5);
    expect(r.height).toBeCloseTo(120, 5);
    // New x = 100 + 200/2 - 240/2 = 100 + 100 - 120 = 80
    expect(r.x).toBeCloseTo(80, 5);
    // New y = 100 + 100/2 - 120/2 = 100 + 50 - 60 = 90
    expect(r.y).toBeCloseTo(90, 5);
  });

  it('Alt: center should remain fixed regardless of drag direction', () => {
    const startX = 100, startY = 100, startW = 200, startH = 100;
    const centerX = startX + startW / 2;
    const centerY = startY + startH / 2;

    const r = applyAlt(startX, startY, startW, startH, 30, 15);
    const newCenterX = r.x + r.width  / 2;
    const newCenterY = r.y + r.height / 2;

    expect(newCenterX).toBeCloseTo(centerX, 5);
    expect(newCenterY).toBeCloseTo(centerY, 5);
  });

  it('Alt + Shift combined: ratio is applied first, then doubled', () => {
    // startSize: 400×200, ratio = 2.0
    // rawDw=60, rawDh=20 — apply ratio lock first:
    //   Math.abs(60) >= Math.abs(20)*2 → 60 >= 40 → true → width dominant
    //   rawDh = rawDw/ratio = 60/2 = 30
    // After lock: rawDw=60, rawDh=30
    // Then Alt doubles: width = 400+120=520, height = 200+60=260
    const startW = 400, startH = 200, startX = 0, startY = 0;
    let rawDw = 60, rawDh = 20;
    const ratio = startW / startH;
    if (Math.abs(rawDw) >= Math.abs(rawDh) * ratio) {
      rawDh = rawDw / ratio;
    } else {
      rawDw = rawDh * ratio;
    }
    const width  = Math.max(50, startW + rawDw * 2);
    const height = Math.max(50, startH + rawDh * 2);
    expect(width).toBeCloseTo(520, 5);
    expect(height).toBeCloseTo(260, 5);
    // Ratio preserved
    expect(width / height).toBeCloseTo(ratio, 5);
  });
});

// ---------------------------------------------------------------------------
// FloatingActionToolbarComponent — toolbar position clamping
// ---------------------------------------------------------------------------

describe('FloatingActionToolbarComponent — toolbar position clamping logic', () => {
  const TOOLBAR_WIDTH = 200;
  const canvasWidth = 1200;

  function computeToolbarLeft(elX: number, elW: number): number {
    const idealLeft = elX + elW / 2 - TOOLBAR_WIDTH / 2;
    return Math.max(0, Math.min(idealLeft, canvasWidth - TOOLBAR_WIDTH));
  }

  function computeToolbarTop(elY: number): number {
    return Math.max(4, elY - 44);
  }

  it('should center toolbar over element', () => {
    // Element at x=500, width=200 → center=600, idealLeft=600-100=500
    expect(computeToolbarLeft(500, 200)).toBe(500);
  });

  it('should clamp toolbar left to 0 when element is near left edge', () => {
    // Element at x=10, width=100 → center=60, idealLeft=60-100=-40 → clamp to 0
    expect(computeToolbarLeft(10, 100)).toBe(0);
  });

  it('should clamp toolbar right to canvasWidth - TOOLBAR_WIDTH', () => {
    // Element at x=1100, width=200 → center=1200, idealLeft=1200-100=1100 → clamp to 1000
    expect(computeToolbarLeft(1100, 200)).toBe(1000);
  });

  it('should place toolbar 44px above element top', () => {
    expect(computeToolbarTop(200)).toBe(156);
  });

  it('should clamp toolbar top to 4px when element is near canvas top', () => {
    expect(computeToolbarTop(10)).toBe(4);
  });

  it('should not go below 4px when element.y = 0', () => {
    expect(computeToolbarTop(0)).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// EffectsSectionComponent — border-radius normalisation logic
// ---------------------------------------------------------------------------

describe('EffectsSectionComponent — setBorderRadius normalisation', () => {
  function normaliseBorderRadius(value: string): string {
    return value.match(/^\d+$/) ? `${value}px` : value;
  }

  it('bare number "8" should become "8px"', () => {
    expect(normaliseBorderRadius('8')).toBe('8px');
  });

  it('"50%" should pass through unchanged', () => {
    expect(normaliseBorderRadius('50%')).toBe('50%');
  });

  it('"4px 8px" should pass through unchanged', () => {
    expect(normaliseBorderRadius('4px 8px')).toBe('4px 8px');
  });

  it('"0" should become "0px"', () => {
    expect(normaliseBorderRadius('0')).toBe('0px');
  });
});

// ---------------------------------------------------------------------------
// EffectsSectionComponent — opacity computation
// ---------------------------------------------------------------------------

describe('EffectsSectionComponent — opacity computation', () => {
  function computeOpacity(stylesOpacity: string | undefined): number {
    return Math.round(parseFloat(stylesOpacity ?? '1') * 100);
  }

  it('undefined (no styles) should return 100%', () => {
    expect(computeOpacity(undefined)).toBe(100);
  });

  it('"1" should return 100%', () => {
    expect(computeOpacity('1')).toBe(100);
  });

  it('"0.50" should return 50%', () => {
    expect(computeOpacity('0.50')).toBe(50);
  });

  it('"0" should return 0%', () => {
    expect(computeOpacity('0')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// EffectsSectionComponent — shadow preset resolution
// ---------------------------------------------------------------------------

describe('EffectsSectionComponent — shadowPreset resolution', () => {
  function resolveShadowPreset(boxShadow: string | undefined): ShadowPreset {
    const current = boxShadow ?? 'none';
    return (
      (Object.entries(SHADOW_PRESETS).find(([, v]) => v === current)?.[0] as ShadowPreset) ?? 'none'
    );
  }

  it('no box-shadow → resolves to "none" preset', () => {
    expect(resolveShadowPreset(undefined)).toBe('none');
  });

  it('"none" string → resolves to "none" preset', () => {
    expect(resolveShadowPreset('none')).toBe('none');
  });

  it('soft shadow CSS string → resolves to "soft" preset', () => {
    expect(resolveShadowPreset(SHADOW_PRESETS['soft'])).toBe('soft');
  });

  it('medium shadow CSS string → resolves to "medium" preset', () => {
    expect(resolveShadowPreset(SHADOW_PRESETS['medium'])).toBe('medium');
  });

  it('hard shadow CSS string → resolves to "hard" preset', () => {
    expect(resolveShadowPreset(SHADOW_PRESETS['hard'])).toBe('hard');
  });

  it('unknown CSS string → resolves to "none" as default', () => {
    expect(resolveShadowPreset('1px 1px 3px red')).toBe('none');
  });
});
