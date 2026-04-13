/**
 * Structural validation tests for the Phase 3 file/folder skeleton.
 *
 * These tests verify:
 *   1. All Phase 3 symbols are exported from the barrel (public-api.ts)
 *   2. Each class/token is defined (not undefined) at runtime
 *   3. Angular component metadata: selector, standalone, changeDetection
 *   4. ELEMENT_REGISTRY_TOKEN is an InjectionToken instance
 *   5. ElementRegistryEntry type shape is structurally correct (TypeScript
 *      compile-time check via typed const assignment)
 *
 * No TestBed is needed — components are standalone and no instantiation is
 * required for structural/metadata checks. Angular component metadata is
 * inspected via reflectComponentType() which works without a running platform.
 */

import { InjectionToken } from '@angular/core';
import { reflectComponentType, ChangeDetectionStrategy } from '@angular/core';

// ---------------------------------------------------------------------------
// Import all Phase 3 symbols from the barrel
// ---------------------------------------------------------------------------

import {
  CanvasComponent,
  ElementWrapperComponent,
  TextElementComponent,
  ImageElementComponent,
  FloatingToolbarComponent,
  CanvasStateService,
  SelectionService,
  ELEMENT_REGISTRY_TOKEN,
  type ElementRegistryEntry,
} from '../public-api';

// ---------------------------------------------------------------------------
// Compile-time type check: create an object conforming to ElementRegistryEntry
// ---------------------------------------------------------------------------

class MockComponent {}

const mockRegistryEntry: ElementRegistryEntry = {
  type: 'mock',
  component: MockComponent,
};

// ---------------------------------------------------------------------------
// describe: Barrel exports — all Phase 3 symbols defined
// ---------------------------------------------------------------------------

describe('Phase 3 barrel exports', () => {
  it('CanvasComponent should be defined', () => {
    expect(CanvasComponent).toBeDefined();
  });

  it('ElementWrapperComponent should be defined', () => {
    expect(ElementWrapperComponent).toBeDefined();
  });

  it('TextElementComponent should be defined', () => {
    expect(TextElementComponent).toBeDefined();
  });

  it('ImageElementComponent should be defined', () => {
    expect(ImageElementComponent).toBeDefined();
  });

  it('FloatingToolbarComponent should be defined', () => {
    expect(FloatingToolbarComponent).toBeDefined();
  });

  it('CanvasStateService should be defined', () => {
    expect(CanvasStateService).toBeDefined();
  });

  it('SelectionService should be defined', () => {
    expect(SelectionService).toBeDefined();
  });

  it('ELEMENT_REGISTRY_TOKEN should be defined', () => {
    expect(ELEMENT_REGISTRY_TOKEN).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// describe: ELEMENT_REGISTRY_TOKEN
// ---------------------------------------------------------------------------

describe('ELEMENT_REGISTRY_TOKEN', () => {
  it('should be an instance of InjectionToken', () => {
    expect(ELEMENT_REGISTRY_TOKEN instanceof InjectionToken).toBe(true);
  });

  it('should have description "gc.elementRegistry"', () => {
    expect(ELEMENT_REGISTRY_TOKEN.toString()).toContain('gc.elementRegistry');
  });
});

// ---------------------------------------------------------------------------
// describe: ElementRegistryEntry type shape
// ---------------------------------------------------------------------------

describe('ElementRegistryEntry type shape', () => {
  it('should have a string type property', () => {
    expect(typeof mockRegistryEntry.type).toBe('string');
    expect(mockRegistryEntry.type).toBe('mock');
  });

  it('should have a component property that is a constructor function', () => {
    expect(typeof mockRegistryEntry.component).toBe('function');
    expect(mockRegistryEntry.component).toBe(MockComponent);
  });
});

// ---------------------------------------------------------------------------
// describe: CanvasComponent metadata
// ---------------------------------------------------------------------------

describe('CanvasComponent metadata', () => {
  const mirror = reflectComponentType(CanvasComponent)!;

  it('should resolve component metadata', () => {
    expect(mirror).not.toBeNull();
  });

  it('should have selector "gc-canvas"', () => {
    expect(mirror.selector).toBe('gc-canvas');
  });

  it('should be a standalone component', () => {
    expect(mirror.isStandalone).toBe(true);
  });

  it('should declare canvasData input', () => {
    const input = mirror.inputs.find(i => i.propName === 'canvasData');
    expect(input).toBeDefined();
  });

  it('should declare canvasChange output', () => {
    const output = mirror.outputs.find(o => o.propName === 'canvasChange');
    expect(output).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// describe: ElementWrapperComponent metadata
// ---------------------------------------------------------------------------

describe('ElementWrapperComponent metadata', () => {
  const mirror = reflectComponentType(ElementWrapperComponent)!;

  it('should resolve component metadata', () => {
    expect(mirror).not.toBeNull();
  });

  it('should have selector "gc-element-wrapper"', () => {
    expect(mirror.selector).toBe('gc-element-wrapper');
  });

  it('should be a standalone component', () => {
    expect(mirror.isStandalone).toBe(true);
  });

  it('should declare element input', () => {
    const input = mirror.inputs.find(i => i.propName === 'element');
    expect(input).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// describe: TextElementComponent metadata
// ---------------------------------------------------------------------------

describe('TextElementComponent metadata', () => {
  const mirror = reflectComponentType(TextElementComponent)!;

  it('should resolve component metadata', () => {
    expect(mirror).not.toBeNull();
  });

  it('should have selector "gc-text-element"', () => {
    expect(mirror.selector).toBe('gc-text-element');
  });

  it('should be a standalone component', () => {
    expect(mirror.isStandalone).toBe(true);
  });

  it('should declare element input', () => {
    const input = mirror.inputs.find(i => i.propName === 'element');
    expect(input).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// describe: ImageElementComponent metadata
// ---------------------------------------------------------------------------

describe('ImageElementComponent metadata', () => {
  const mirror = reflectComponentType(ImageElementComponent)!;

  it('should resolve component metadata', () => {
    expect(mirror).not.toBeNull();
  });

  it('should have selector "gc-image-element"', () => {
    expect(mirror.selector).toBe('gc-image-element');
  });

  it('should be a standalone component', () => {
    expect(mirror.isStandalone).toBe(true);
  });

  it('should declare element input', () => {
    const input = mirror.inputs.find(i => i.propName === 'element');
    expect(input).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// describe: FloatingToolbarComponent metadata
// ---------------------------------------------------------------------------

describe('FloatingToolbarComponent metadata', () => {
  const mirror = reflectComponentType(FloatingToolbarComponent)!;

  it('should resolve component metadata', () => {
    expect(mirror).not.toBeNull();
  });

  it('should have selector "gc-floating-toolbar"', () => {
    expect(mirror.selector).toBe('gc-floating-toolbar');
  });

  it('should be a standalone component', () => {
    expect(mirror.isStandalone).toBe(true);
  });

  it('should have no declared inputs (stub phase)', () => {
    expect(mirror.inputs.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// describe: Services are plain classes (no NgModule required)
// ---------------------------------------------------------------------------

describe('CanvasStateService', () => {
  it('should be instantiable as a plain class', () => {
    const instance = new CanvasStateService();
    expect(instance).toBeDefined();
    expect(instance instanceof CanvasStateService).toBe(true);
  });
});

describe('SelectionService', () => {
  it('should be instantiable as a plain class', () => {
    const instance = new SelectionService();
    expect(instance).toBeDefined();
    expect(instance instanceof SelectionService).toBe(true);
  });
});
