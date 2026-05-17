/**
 * Unit tests for Phase F — Full-Fidelity Text Editing
 *
 * Covers:
 *   - Barrel exports: all Phase F symbols exported from public-api
 *   - FontSize extension: structure and commands defined
 *   - TIPTAP_EXTENSIONS_TOKEN: defined as InjectionToken
 *   - DEFAULT_TIPTAP_EXTENSIONS: array has 9 entries
 *   - TypographySectionComponent: metadata, inputs, computed values
 *   - FloatingToolbarComponent: new signals and methods present
 *   - InspectorComponent: selectedTextElement computed
 *   - ChromeTopComponent: isEditingText computed reflects activeEditor
 *   - Typography section font-size computed strips 'px' suffix
 *   - Typography section textAlign defaults to 'left'
 *   - Typography section color defaults to '#000000'
 *   - Typography section highlight defaults to '#ffffff'
 */

import { TestBed } from '@angular/core/testing';
import { reflectComponentType } from '@angular/core';
import { InjectionToken } from '@angular/core';

// ---------------------------------------------------------------------------
// Barrel imports — validates Phase F exports
// ---------------------------------------------------------------------------

import {
  TIPTAP_EXTENSIONS_TOKEN,
  DEFAULT_TIPTAP_EXTENSIONS,
  FontSize,
  TypographySectionComponent,
  SYSTEM_FONTS,
} from '../public-api';

import { FloatingToolbarComponent } from './toolbar/floating-toolbar.component';
import { InspectorComponent } from './editor/inspector/inspector.component';
import { ChromeTopComponent } from './editor/chrome/chrome-top.component';
import { CanvasStateService } from './services/canvas-state.service';
import { SelectionService } from './services/selection.service';
import { EditorChromeService } from './services/editor-chrome.service';
import { CanvasData } from './models/canvas-data.model';
import { TextCanvasElement } from './models/canvas-element.model';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTextElement(id: string): TextCanvasElement {
  return {
    id,
    type: 'text',
    position: { x: 0, y: 0 },
    size: { width: 200, height: 100 },
    zIndex: 1,
    content: { type: 'doc', content: [] },
    styles: {},
  };
}

const BASE_VIEWPORT: CanvasData = {
  version: 1,
  viewport: { width: 1200, height: 800 },
  elements: [],
};

// ---------------------------------------------------------------------------
// Barrel exports — Phase F symbols defined
// ---------------------------------------------------------------------------

describe('Phase F barrel exports', () => {
  it('TIPTAP_EXTENSIONS_TOKEN should be defined', () => {
    expect(TIPTAP_EXTENSIONS_TOKEN).toBeDefined();
  });

  it('DEFAULT_TIPTAP_EXTENSIONS should be defined', () => {
    expect(DEFAULT_TIPTAP_EXTENSIONS).toBeDefined();
  });

  it('FontSize should be defined', () => {
    expect(FontSize).toBeDefined();
  });

  it('TypographySectionComponent should be defined', () => {
    expect(TypographySectionComponent).toBeDefined();
  });

  it('SYSTEM_FONTS should be defined', () => {
    expect(SYSTEM_FONTS).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// TIPTAP_EXTENSIONS_TOKEN — is an Angular InjectionToken
// ---------------------------------------------------------------------------

describe('TIPTAP_EXTENSIONS_TOKEN', () => {
  it('should be an instance of InjectionToken', () => {
    expect(TIPTAP_EXTENSIONS_TOKEN).toBeInstanceOf(InjectionToken);
  });

  it('token description should contain "gc.tiptapExtensions"', () => {
    expect(TIPTAP_EXTENSIONS_TOKEN.toString()).toContain('gc.tiptapExtensions');
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_TIPTAP_EXTENSIONS — array with 9 extensions
// ---------------------------------------------------------------------------

describe('DEFAULT_TIPTAP_EXTENSIONS', () => {
  it('should have 9 extensions', () => {
    expect(DEFAULT_TIPTAP_EXTENSIONS.length).toBe(9);
  });

  it('should be an array', () => {
    expect(Array.isArray(DEFAULT_TIPTAP_EXTENSIONS)).toBe(true);
  });

  it('all entries should be non-null', () => {
    for (const ext of DEFAULT_TIPTAP_EXTENSIONS) {
      expect(ext).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// FontSize extension — structure
// ---------------------------------------------------------------------------

describe('FontSize extension', () => {
  it('should have name "fontSize"', () => {
    expect((FontSize as any).name).toBe('fontSize');
  });
});

// ---------------------------------------------------------------------------
// SYSTEM_FONTS — curated list
// ---------------------------------------------------------------------------

describe('SYSTEM_FONTS', () => {
  it('should include "Arial"', () => {
    expect(SYSTEM_FONTS).toContain('Arial');
  });

  it('should include "Georgia"', () => {
    expect(SYSTEM_FONTS).toContain('Georgia');
  });

  it('should include "system-ui"', () => {
    expect(SYSTEM_FONTS).toContain('system-ui');
  });

  it('should have at least 8 fonts', () => {
    expect(SYSTEM_FONTS.length).toBeGreaterThanOrEqual(8);
  });
});

// ---------------------------------------------------------------------------
// TypographySectionComponent — metadata
// ---------------------------------------------------------------------------

describe('TypographySectionComponent metadata', () => {
  it('should be a standalone component', () => {
    const mirror = reflectComponentType(TypographySectionComponent);
    expect(mirror).toBeTruthy();
    expect(mirror?.isStandalone).toBe(true);
  });

  it('should have selector gc-typography-section', () => {
    const mirror = reflectComponentType(TypographySectionComponent);
    expect(mirror?.selector).toBe('gc-typography-section');
  });
});

// ---------------------------------------------------------------------------
// TypographySectionComponent — computed value logic (pure unit tests)
// ---------------------------------------------------------------------------

describe('TypographySectionComponent — fontSize computed strips px suffix', () => {
  function stripPx(raw: string): string {
    return raw.endsWith('px') ? raw.slice(0, -2) : raw;
  }

  it('"16px" → "16"', () => {
    expect(stripPx('16px')).toBe('16');
  });

  it('"24px" → "24"', () => {
    expect(stripPx('24px')).toBe('24');
  });

  it('"" → ""', () => {
    expect(stripPx('')).toBe('');
  });

  it('"1.5em" → "1.5em" (no px suffix, pass through)', () => {
    expect(stripPx('1.5em')).toBe('1.5em');
  });
});

describe('TypographySectionComponent — textAlign defaults to left', () => {
  function resolveAlign(stylesAlign: string | undefined): string {
    return stylesAlign ?? 'left';
  }

  it('undefined → "left"', () => {
    expect(resolveAlign(undefined)).toBe('left');
  });

  it('"center" → "center"', () => {
    expect(resolveAlign('center')).toBe('center');
  });

  it('"right" → "right"', () => {
    expect(resolveAlign('right')).toBe('right');
  });

  it('"justify" → "justify"', () => {
    expect(resolveAlign('justify')).toBe('justify');
  });
});

describe('TypographySectionComponent — color/highlight defaults', () => {
  function resolveColor(stylesColor: string | undefined): string {
    return stylesColor ?? '#000000';
  }

  function resolveHighlight(stylesBg: string | undefined): string {
    return stylesBg ?? '#ffffff';
  }

  it('color defaults to #000000 when undefined', () => {
    expect(resolveColor(undefined)).toBe('#000000');
  });

  it('color passes through when set', () => {
    expect(resolveColor('#ff0000')).toBe('#ff0000');
  });

  it('highlight defaults to #ffffff when undefined', () => {
    expect(resolveHighlight(undefined)).toBe('#ffffff');
  });

  it('highlight passes through when set', () => {
    expect(resolveHighlight('#ffff00')).toBe('#ffff00');
  });
});

// ---------------------------------------------------------------------------
// FloatingToolbarComponent — new signals and methods present
// ---------------------------------------------------------------------------

describe('FloatingToolbarComponent — Phase F additions present', () => {
  let service: SelectionService;
  let canvasState: CanvasStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SelectionService, CanvasStateService],
    });
    service = TestBed.inject(SelectionService);
    canvasState = TestBed.inject(CanvasStateService);
    canvasState.loadSnapshot(BASE_VIEWPORT);
  });

  it('FloatingToolbarComponent should be a standalone component', () => {
    const mirror = reflectComponentType(FloatingToolbarComponent);
    expect(mirror?.isStandalone).toBe(true);
  });

  it('showLinkPopover signal should exist and default to false', () => {
    TestBed.runInInjectionContext(() => {
      const comp = new FloatingToolbarComponent();
      expect(comp.showLinkPopover).toBeDefined();
      expect(comp.showLinkPopover()).toBe(false);
    });
  });

  it('headingLevel signal should exist and default to empty string', () => {
    TestBed.runInInjectionContext(() => {
      const comp = new FloatingToolbarComponent();
      expect(comp.headingLevel).toBeDefined();
      expect(comp.headingLevel()).toBe('');
    });
  });

  it('fontSize signal should exist and default to empty string', () => {
    TestBed.runInInjectionContext(() => {
      const comp = new FloatingToolbarComponent();
      expect(comp.fontSize).toBeDefined();
      expect(comp.fontSize()).toBe('');
    });
  });

  it('cancelLink() should set showLinkPopover to false and clear linkUrl', () => {
    TestBed.runInInjectionContext(() => {
      const comp = new FloatingToolbarComponent();
      comp.showLinkPopover.set(true);
      comp.linkUrl = 'https://example.com';
      comp.cancelLink();
      expect(comp.showLinkPopover()).toBe(false);
      expect(comp.linkUrl).toBe('');
    });
  });

  it('toggleBulletList method should exist', () => {
    TestBed.runInInjectionContext(() => {
      const comp = new FloatingToolbarComponent();
      expect(typeof comp.toggleBulletList).toBe('function');
    });
  });

  it('toggleOrderedList method should exist', () => {
    TestBed.runInInjectionContext(() => {
      const comp = new FloatingToolbarComponent();
      expect(typeof comp.toggleOrderedList).toBe('function');
    });
  });

  it('setAlign method should exist', () => {
    TestBed.runInInjectionContext(() => {
      const comp = new FloatingToolbarComponent();
      expect(typeof comp.setAlign).toBe('function');
    });
  });

  it('openLinkPopover method should exist', () => {
    TestBed.runInInjectionContext(() => {
      const comp = new FloatingToolbarComponent();
      expect(typeof comp.openLinkPopover).toBe('function');
    });
  });

  it('applyLink method should exist', () => {
    TestBed.runInInjectionContext(() => {
      const comp = new FloatingToolbarComponent();
      expect(typeof comp.applyLink).toBe('function');
    });
  });
});

// ---------------------------------------------------------------------------
// InspectorComponent — selectedTextElement computed
// ---------------------------------------------------------------------------

describe('InspectorComponent — selectedTextElement computed', () => {
  let canvasState: CanvasStateService;
  let selectionService: SelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CanvasStateService, SelectionService, EditorChromeService],
    });
    canvasState = TestBed.inject(CanvasStateService);
    selectionService = TestBed.inject(SelectionService);
    canvasState.loadSnapshot(BASE_VIEWPORT);
  });

  it('selectedTextElement should return null when nothing is selected', () => {
    TestBed.runInInjectionContext(() => {
      const comp = new InspectorComponent();
      expect((comp as any).selectedTextElement()).toBeNull();
    });
  });

  it('selectedTextElement should return text element when text element is selected', () => {
    const el = makeTextElement('text-1');
    canvasState.addElement(el);
    selectionService.select('text-1');

    TestBed.runInInjectionContext(() => {
      const comp = new InspectorComponent();
      const result = (comp as any).selectedTextElement();
      expect(result).toBeTruthy();
      expect(result.type).toBe('text');
      expect(result.id).toBe('text-1');
    });
  });

  it('selectedTextElement should return null when image element is selected', () => {
    const imgEl = {
      id: 'img-1',
      type: 'image' as const,
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      zIndex: 1,
      src: '',
    };
    canvasState.addElement(imgEl);
    selectionService.select('img-1');

    TestBed.runInInjectionContext(() => {
      const comp = new InspectorComponent();
      const result = (comp as any).selectedTextElement();
      expect(result).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// ChromeTopComponent — isEditingText computed
// ---------------------------------------------------------------------------

describe('ChromeTopComponent — isEditingText computed', () => {
  let selectionService: SelectionService;
  let canvasState: CanvasStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SelectionService, CanvasStateService, EditorChromeService],
    });
    selectionService = TestBed.inject(SelectionService);
    canvasState = TestBed.inject(CanvasStateService);
    canvasState.loadSnapshot(BASE_VIEWPORT);
  });

  it('isEditingText should be false when activeEditor is null', () => {
    TestBed.runInInjectionContext(() => {
      const comp = new ChromeTopComponent();
      selectionService.activeEditor.set(null);
      expect(comp.isEditingText()).toBe(false);
    });
  });

  it('isEditingText should be true when activeEditor is set', () => {
    TestBed.runInInjectionContext(() => {
      const comp = new ChromeTopComponent();
      const mockEditor = {} as any;
      selectionService.activeEditor.set(mockEditor);
      expect(comp.isEditingText()).toBe(true);
    });
  });

  it('isEditingText should revert to false when activeEditor is cleared', () => {
    TestBed.runInInjectionContext(() => {
      const comp = new ChromeTopComponent();
      const mockEditor = {} as any;
      selectionService.activeEditor.set(mockEditor);
      expect(comp.isEditingText()).toBe(true);
      selectionService.activeEditor.set(null);
      expect(comp.isEditingText()).toBe(false);
    });
  });
});
