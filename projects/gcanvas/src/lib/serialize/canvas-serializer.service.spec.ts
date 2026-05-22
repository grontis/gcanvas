/**
 * Service tests for CanvasSerializer — TestBed with provideCanvas().
 * Tests:
 *   - Service is injectable
 *   - serialize() returns a PublishPayload with all expected fields
 *   - Custom ELEMENT_SERIALIZER_TOKEN entry overrides the default serializer for a type
 *   - Custom IMAGE_RESOLVER_TOKEN is invoked for image elements
 *   - fullDocument contains the SEO title from meta.seoTitle
 */

import { TestBed } from '@angular/core/testing';
import { CanvasSerializer } from './canvas-serializer.service';
import { provideCanvas } from '../providers/provide-canvas';
import { ELEMENT_SERIALIZER_TOKEN, ElementSerializerEntry } from '../tokens/element-serializer.token';
import { IMAGE_RESOLVER_TOKEN, ImageResolver } from '../tokens/image-resolver.token';
import type { CanvasData } from '../models/canvas-data.model';
import type { ImageCanvasElement } from '../models/canvas-element.model';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const EMPTY_CANVAS: CanvasData = {
  version: 1,
  viewport: { width: 1200, height: 800, backgroundColor: '#ffffff' },
  elements: [],
  meta: { seoTitle: 'Test Page', seoDescription: 'A test page' },
};

const CANVAS_WITH_TEXT: CanvasData = {
  version: 1,
  viewport: { width: 1200, height: 800 },
  elements: [
    {
      id: 'text-1',
      type: 'text',
      position: { x: 10, y: 10 },
      size: { width: 200, height: 80 },
      zIndex: 1,
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] }],
      },
    },
  ],
  meta: { seoTitle: 'Canvas Page', seoDescription: 'Description here' },
};

const CANVAS_WITH_IMAGE: CanvasData = {
  version: 1,
  viewport: { width: 1200, height: 800 },
  elements: [
    {
      id: 'img-1',
      type: 'image',
      position: { x: 0, y: 0 },
      size: { width: 300, height: 200 },
      zIndex: 1,
      src: 'https://example.com/photo.jpg',
      alt: 'Test photo',
      objectFit: 'cover',
    } as ImageCanvasElement,
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CanvasSerializer service', () => {
  let service: CanvasSerializer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: provideCanvas(),
    });
    service = TestBed.inject(CanvasSerializer);
  });

  it('is injectable via provideCanvas()', () => {
    expect(service).toBeTruthy();
    expect(service instanceof CanvasSerializer).toBe(true);
  });

  it('serialize() returns an object with html, css, fullDocument, meta fields', () => {
    const payload = service.serialize(EMPTY_CANVAS);
    expect(payload.html).toBeDefined();
    expect(payload.css).toBeDefined();
    expect(payload.fullDocument).toBeDefined();
    expect(payload.meta).toBeDefined();
  });

  it('serialize() returns canvasData reference', () => {
    const payload = service.serialize(EMPTY_CANVAS);
    expect(payload.canvasData).toBe(EMPTY_CANVAS);
  });

  it('serialize() html contains canvas export container', () => {
    const payload = service.serialize(EMPTY_CANVAS);
    expect(payload.html).toContain('gc-canvas-export');
  });

  it('fullDocument starts with <!DOCTYPE html>', () => {
    const payload = service.serialize(EMPTY_CANVAS);
    expect(payload.fullDocument.startsWith('<!DOCTYPE html>')).toBe(true);
  });

  it('fullDocument contains the SEO title from meta', () => {
    const payload = service.serialize(CANVAS_WITH_TEXT);
    expect(payload.fullDocument).toContain('<title>Canvas Page</title>');
  });

  it('serialize() with text element produces html with text content', () => {
    const payload = service.serialize(CANVAS_WITH_TEXT);
    expect(payload.html).toContain('Hello world');
  });

  it('serialize() meta matches canvasData.meta', () => {
    const payload = service.serialize(CANVAS_WITH_TEXT);
    expect(payload.meta).toEqual(CANVAS_WITH_TEXT.meta);
  });

  it('serialize() js is undefined when no elements emit js', () => {
    const payload = service.serialize(EMPTY_CANVAS);
    expect(payload.js).toBeUndefined();
  });
});

describe('CanvasSerializer — custom ELEMENT_SERIALIZER_TOKEN override', () => {
  it('custom serializer entry overrides the default for its type', () => {
    const customEntry: ElementSerializerEntry = {
      type: 'text',
      serialize: () => ({ html: '<p class="custom-override">CUSTOM OUTPUT</p>' }),
    };

    TestBed.configureTestingModule({
      providers: [
        ...provideCanvas(),
        { provide: ELEMENT_SERIALIZER_TOKEN, useValue: [customEntry] },
      ],
    });

    const service = TestBed.inject(CanvasSerializer);
    const payload = service.serialize(CANVAS_WITH_TEXT);
    expect(payload.html).toContain('CUSTOM OUTPUT');
    expect(payload.html).not.toContain('Hello world');
  });
});

describe('CanvasSerializer — custom IMAGE_RESOLVER_TOKEN', () => {
  it('IMAGE_RESOLVER_TOKEN override is called for image elements', () => {
    const resolvedUrls: string[] = [];
    const customResolver: ImageResolver = (src: string, _el: ImageCanvasElement) => {
      resolvedUrls.push(src);
      return `https://cdn.example.com/rewritten/${src.split('/').pop()}`;
    };

    TestBed.configureTestingModule({
      providers: [
        ...provideCanvas(),
        { provide: IMAGE_RESOLVER_TOKEN, useValue: customResolver },
      ],
    });

    const service = TestBed.inject(CanvasSerializer);
    service.serialize(CANVAS_WITH_IMAGE);
    expect(resolvedUrls).toContain('https://example.com/photo.jpg');
  });

  it('IMAGE_RESOLVER_TOKEN rewritten URL appears in output', () => {
    const customResolver: ImageResolver = (_src: string, _el: ImageCanvasElement) =>
      'https://cdn.example.com/rewritten.jpg';

    TestBed.configureTestingModule({
      providers: [
        ...provideCanvas(),
        { provide: IMAGE_RESOLVER_TOKEN, useValue: customResolver },
      ],
    });

    const service = TestBed.inject(CanvasSerializer);
    const payload = service.serialize(CANVAS_WITH_IMAGE);
    expect(payload.html).toContain('https://cdn.example.com/rewritten.jpg');
  });
});
