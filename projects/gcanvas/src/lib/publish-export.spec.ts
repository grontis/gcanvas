/**
 * Phase spec: publish-export — barrel exports and public API surface
 *
 * Validates:
 *   - All new public-api exports are present and of the correct shape/type
 *   - CanvasEditorComponent publish output has the correct type (PublishPayload)
 *   - ELEMENT_SERIALIZER_TOKEN and IMAGE_RESOLVER_TOKEN are InjectionToken instances
 *   - provideCanvas() registers default serializers (inject ELEMENT_SERIALIZER_TOKEN, assert four entries)
 *   - BreakpointIframeComponent is exported and has expected metadata
 *   - serializeCanvas and toHtmlDocument are exported as functions
 */

import { TestBed } from '@angular/core/testing';
import { InjectionToken, reflectComponentType } from '@angular/core';

// ---------------------------------------------------------------------------
// Barrel imports — validates publish-export exports
// ---------------------------------------------------------------------------

import {
  ELEMENT_SERIALIZER_TOKEN,
  type ElementSerializerEntry,
  type SerializerContext,
  type SerializedFragment,
  IMAGE_RESOLVER_TOKEN,
  type ImageResolver,
  CanvasSerializer,
  serializeCanvas,
  toHtmlDocument,
  BreakpointIframeComponent,
  type PublishPayload,
} from '../public-api';

import { provideCanvas } from './providers/provide-canvas';
import { CanvasEditorComponent } from './editor/canvas-editor.component';

// ---------------------------------------------------------------------------
// 1. Barrel exports — all new symbols defined
// ---------------------------------------------------------------------------

describe('publish-export barrel exports', () => {
  it('ELEMENT_SERIALIZER_TOKEN is defined', () => {
    expect(ELEMENT_SERIALIZER_TOKEN).toBeDefined();
  });

  it('IMAGE_RESOLVER_TOKEN is defined', () => {
    expect(IMAGE_RESOLVER_TOKEN).toBeDefined();
  });

  it('CanvasSerializer is defined', () => {
    expect(CanvasSerializer).toBeDefined();
  });

  it('serializeCanvas is a function', () => {
    expect(typeof serializeCanvas).toBe('function');
  });

  it('toHtmlDocument is a function', () => {
    expect(typeof toHtmlDocument).toBe('function');
  });

  it('BreakpointIframeComponent is defined', () => {
    expect(BreakpointIframeComponent).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 2. Token shape validation
// ---------------------------------------------------------------------------

describe('ELEMENT_SERIALIZER_TOKEN shape', () => {
  it('is an InjectionToken instance', () => {
    expect(ELEMENT_SERIALIZER_TOKEN).toBeInstanceOf(InjectionToken);
  });

  it('token string contains gc.elementSerializers', () => {
    expect(ELEMENT_SERIALIZER_TOKEN.toString()).toContain('gc.elementSerializers');
  });
});

describe('IMAGE_RESOLVER_TOKEN shape', () => {
  it('is an InjectionToken instance', () => {
    expect(IMAGE_RESOLVER_TOKEN).toBeInstanceOf(InjectionToken);
  });

  it('token string contains gc.imageResolver', () => {
    expect(IMAGE_RESOLVER_TOKEN.toString()).toContain('gc.imageResolver');
  });
});

// ---------------------------------------------------------------------------
// 3. provideCanvas() registers default serializers
// ---------------------------------------------------------------------------

describe('provideCanvas() default serializer registration', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: provideCanvas(),
    });
  });

  it('ELEMENT_SERIALIZER_TOKEN resolves to the default serializers array', () => {
    const serializers = TestBed.inject(ELEMENT_SERIALIZER_TOKEN);
    expect(serializers).toBeDefined();
    expect(Array.isArray(serializers)).toBe(true);
  });

  it('default serializers include text type', () => {
    const serializers = TestBed.inject(ELEMENT_SERIALIZER_TOKEN);
    expect(serializers.some((s: ElementSerializerEntry) => s.type === 'text')).toBe(true);
  });

  it('default serializers include image type', () => {
    const serializers = TestBed.inject(ELEMENT_SERIALIZER_TOKEN);
    expect(serializers.some((s: ElementSerializerEntry) => s.type === 'image')).toBe(true);
  });

  it('default serializers include button type', () => {
    const serializers = TestBed.inject(ELEMENT_SERIALIZER_TOKEN);
    expect(serializers.some((s: ElementSerializerEntry) => s.type === 'button')).toBe(true);
  });

  it('default serializers include shape type', () => {
    const serializers = TestBed.inject(ELEMENT_SERIALIZER_TOKEN);
    expect(serializers.some((s: ElementSerializerEntry) => s.type === 'shape')).toBe(true);
  });

  it('there are exactly four default serializer entries', () => {
    const serializers = TestBed.inject(ELEMENT_SERIALIZER_TOKEN);
    expect(serializers.length).toBe(4);
  });

  it('IMAGE_RESOLVER_TOKEN resolves to the default identity resolver', () => {
    const resolver = TestBed.inject(IMAGE_RESOLVER_TOKEN);
    expect(typeof resolver).toBe('function');
  });

  it('default IMAGE_RESOLVER_TOKEN returns src unchanged', () => {
    const resolver: ImageResolver = TestBed.inject(IMAGE_RESOLVER_TOKEN);
    const result = resolver('https://example.com/img.jpg', {} as any);
    expect(result).toBe('https://example.com/img.jpg');
  });

  it('CanvasSerializer is provided', () => {
    const svc = TestBed.inject(CanvasSerializer);
    expect(svc).toBeTruthy();
    expect(svc instanceof CanvasSerializer).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. CanvasEditorComponent publish output type
// ---------------------------------------------------------------------------

describe('CanvasEditorComponent publish output', () => {
  it('publish output exists on CanvasEditorComponent', () => {
    const mirror = reflectComponentType(CanvasEditorComponent);
    expect(mirror).toBeTruthy();
    const publishOutput = mirror?.outputs.find(o => o.propName === 'publish');
    expect(publishOutput).toBeTruthy();
  });

  it('publish output templateName is "publish"', () => {
    const mirror = reflectComponentType(CanvasEditorComponent);
    const publishOutput = mirror?.outputs.find(o => o.propName === 'publish');
    expect(publishOutput?.templateName).toBe('publish');
  });
});

// ---------------------------------------------------------------------------
// 5. BreakpointIframeComponent metadata
// ---------------------------------------------------------------------------

describe('BreakpointIframeComponent metadata', () => {
  it('is a standalone component', () => {
    const mirror = reflectComponentType(BreakpointIframeComponent);
    expect(mirror?.isStandalone).toBe(true);
  });

  it('has selector gc-breakpoint-iframe', () => {
    const mirror = reflectComponentType(BreakpointIframeComponent);
    expect(mirror?.selector).toBe('gc-breakpoint-iframe');
  });

  it('has srcdoc input', () => {
    const mirror = reflectComponentType(BreakpointIframeComponent);
    expect(mirror?.inputs.some(i => i.propName === 'srcdoc')).toBe(true);
  });

  it('has width input', () => {
    const mirror = reflectComponentType(BreakpointIframeComponent);
    expect(mirror?.inputs.some(i => i.propName === 'width')).toBe(true);
  });

  it('has height input', () => {
    const mirror = reflectComponentType(BreakpointIframeComponent);
    expect(mirror?.inputs.some(i => i.propName === 'height')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. ResponsivePreviewComponent — previewMode input added
// ---------------------------------------------------------------------------

describe('ResponsivePreviewComponent — previewMode input', () => {
  it('has previewMode input', async () => {
    const { ResponsivePreviewComponent } = await import('./preview/responsive-preview.component');
    const mirror = reflectComponentType(ResponsivePreviewComponent);
    expect(mirror?.inputs.some(i => i.propName === 'previewMode')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. PublishModalComponent — hasBlockingErrors signal
// ---------------------------------------------------------------------------

describe('PublishModalComponent — hasBlockingErrors', () => {
  it('hasBlockingErrors is false when preflightResults have no error severity', async () => {
    const { CanvasStateService } = await import('./services/canvas-state.service');
    const { SelectionService } = await import('./services/selection.service');
    const { EditorChromeService } = await import('./services/editor-chrome.service');
    const { PublishModalComponent } = await import('./publish/publish-modal.component');

    TestBed.configureTestingModule({
      providers: [CanvasStateService, SelectionService, EditorChromeService],
    });
    const canvasState = TestBed.inject(CanvasStateService);
    canvasState.loadSnapshot({
      version: 1,
      viewport: { width: 1200, height: 800 },
      elements: [],
      meta: { seoTitle: 'Title', seoDescription: 'Desc' },
    });
    TestBed.runInInjectionContext(() => {
      const comp = new PublishModalComponent();
      expect(comp.hasBlockingErrors()).toBe(false);
    });
  });
});
