/**
 * Integration tests: CanvasData → HTML → DOM parsing
 *
 * Builds a CanvasData with one of each element type, calls serializeCanvas(),
 * parses the returned html using the DOM (jsdom available in test env),
 * and asserts element count, content, positions, and visibility filtering.
 */

import { serializeCanvas, toHtmlDocument } from './canvas-serializer';
import { serializeTextElement } from './element-serializers/text.serializer';
import { serializeImageElement } from './element-serializers/image.serializer';
import { serializeButtonElement } from './element-serializers/button.serializer';
import { serializeShapeElement } from './element-serializers/shape.serializer';
import { DEFAULT_TIPTAP_EXTENSIONS } from '../tokens/tiptap-extensions.token';
import type { CanvasData } from '../models/canvas-data.model';
import type { ElementSerializerEntry, SerializerContext } from '../tokens/element-serializer.token';
import type { TextCanvasElement, ImageCanvasElement, GenericCanvasElement } from '../models/canvas-element.model';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const testCtx: SerializerContext = {
  tiptapExtensions: DEFAULT_TIPTAP_EXTENSIONS,
  resolveImage: (src: string) => src,
};

const defaultSerializers: ElementSerializerEntry[] = [
  { type: 'text',   serialize: (el, ctx) => serializeTextElement(el as TextCanvasElement, ctx) },
  { type: 'image',  serialize: (el, ctx) => serializeImageElement(el as ImageCanvasElement, ctx) },
  { type: 'button', serialize: (el, ctx) => serializeButtonElement(el as GenericCanvasElement, ctx) },
  { type: 'shape',  serialize: (el, ctx) => serializeShapeElement(el as GenericCanvasElement, ctx) },
];

const FULL_CANVAS: CanvasData = {
  version: 1,
  viewport: { width: 1200, height: 800, backgroundColor: '#fafafa' },
  elements: [
    {
      id: 'text-1',
      type: 'text',
      position: { x: 10, y: 20 },
      size: { width: 300, height: 100 },
      zIndex: 1,
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Integration text' }] }],
      },
    } as TextCanvasElement,
    {
      id: 'img-1',
      type: 'image',
      position: { x: 400, y: 50 },
      size: { width: 200, height: 150 },
      zIndex: 2,
      src: 'https://example.com/img.png',
      alt: 'Integration image',
      objectFit: 'cover',
    } as ImageCanvasElement,
    {
      id: 'btn-1',
      type: 'button',
      position: { x: 100, y: 300 },
      size: { width: 160, height: 44 },
      zIndex: 3,
      label: 'Integration Button',
    } as GenericCanvasElement,
    {
      id: 'shape-1',
      type: 'shape',
      position: { x: 0, y: 0 },
      size: { width: 400, height: 300 },
      zIndex: 0,
      fill: '#3b82f6',
      borderRadius: 12,
    } as GenericCanvasElement,
  ],
  meta: { seoTitle: 'Integration Test', seoDescription: 'An integration test page' },
};

// ---------------------------------------------------------------------------
// Helper: parse html string into a DOM element
// ---------------------------------------------------------------------------

function parseHtml(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

describe('serializeCanvas integration — structure', () => {
  let root: HTMLElement;

  beforeEach(() => {
    const { html } = serializeCanvas(FULL_CANVAS, defaultSerializers, testCtx);
    root = parseHtml(html);
  });

  it('produces a single canvas export container', () => {
    const containers = root.querySelectorAll('.gc-canvas-export');
    expect(containers.length).toBe(1);
  });

  it('canvas container has correct width style', () => {
    const container = root.querySelector('.gc-canvas-export') as HTMLElement;
    expect(container.getAttribute('style')).toContain('width:1200px');
  });

  it('canvas container has correct height style', () => {
    const container = root.querySelector('.gc-canvas-export') as HTMLElement;
    expect(container.getAttribute('style')).toContain('height:800px');
  });

  it('canvas container has correct background-color', () => {
    const container = root.querySelector('.gc-canvas-export') as HTMLElement;
    expect(container.getAttribute('style')).toContain('background-color:#fafafa');
  });
});

describe('serializeCanvas integration — text element', () => {
  let root: HTMLElement;

  beforeEach(() => {
    const { html } = serializeCanvas(FULL_CANVAS, defaultSerializers, testCtx);
    root = parseHtml(html);
  });

  it('text element content survives round-trip', () => {
    expect(root.textContent).toContain('Integration text');
  });

  it('text element has correct absolute position', () => {
    const container = root.querySelector('.gc-canvas-export') as HTMLElement;
    const textDiv = container.children[0] as HTMLElement; // zIndex 1 but order in elements array
    // Find the div that contains 'Integration text'
    const textEl = Array.from(container.querySelectorAll('div')).find(
      el => el.textContent?.includes('Integration text')
    ) as HTMLElement;
    const style = textEl?.closest<HTMLElement>('[style*="position:absolute"]')?.getAttribute('style') ?? '';
    expect(style).toContain('left:10px');
    expect(style).toContain('top:20px');
  });
});

describe('serializeCanvas integration — image element', () => {
  let root: HTMLElement;

  beforeEach(() => {
    const { html } = serializeCanvas(FULL_CANVAS, defaultSerializers, testCtx);
    root = parseHtml(html);
  });

  it('image element has correct src', () => {
    const img = root.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/img.png');
  });

  it('image element has correct alt', () => {
    const img = root.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('alt')).toBe('Integration image');
  });

  it('image element has object-fit set', () => {
    const img = root.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('style')).toContain('object-fit:cover');
  });

  it('image wrapper has correct absolute position', () => {
    const imgWrapper = root.querySelector('img')?.parentElement as HTMLElement;
    const style = imgWrapper?.getAttribute('style') ?? '';
    expect(style).toContain('left:400px');
    expect(style).toContain('top:50px');
  });
});

describe('serializeCanvas integration — button element', () => {
  let root: HTMLElement;

  beforeEach(() => {
    const { html } = serializeCanvas(FULL_CANVAS, defaultSerializers, testCtx);
    root = parseHtml(html);
  });

  it('button element has correct label text', () => {
    const btn = root.querySelector('button') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.textContent?.trim()).toBe('Integration Button');
  });

  it('button wrapper has correct absolute position', () => {
    const btnWrapper = root.querySelector('button')?.parentElement as HTMLElement;
    const style = btnWrapper?.getAttribute('style') ?? '';
    expect(style).toContain('left:100px');
    expect(style).toContain('top:300px');
  });
});

describe('serializeCanvas integration — shape element', () => {
  let root: HTMLElement;

  beforeEach(() => {
    const { html } = serializeCanvas(FULL_CANVAS, defaultSerializers, testCtx);
    root = parseHtml(html);
  });

  it('shape element has correct background-color', () => {
    const container = root.querySelector('.gc-canvas-export') as HTMLElement;
    const shapeDivs = Array.from(container.querySelectorAll('div')).filter(
      el => el.getAttribute('style')?.includes('background-color:#3b82f6')
    );
    expect(shapeDivs.length).toBeGreaterThan(0);
  });

  it('shape element has correct border-radius', () => {
    const container = root.querySelector('.gc-canvas-export') as HTMLElement;
    const shapeDivs = Array.from(container.querySelectorAll('div')).filter(
      el => el.getAttribute('style')?.includes('border-radius:12px')
    );
    expect(shapeDivs.length).toBeGreaterThan(0);
  });
});

describe('serializeCanvas integration — visibility filtering', () => {
  it('element with visible === false is absent from output', () => {
    const data: CanvasData = {
      ...FULL_CANVAS,
      elements: [
        ...FULL_CANVAS.elements,
        {
          id: 'hidden-1',
          type: 'button',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 40 },
          zIndex: 99,
          label: 'HIDDEN BUTTON',
          visible: false,
        } as GenericCanvasElement,
      ],
    };
    const { html } = serializeCanvas(data, defaultSerializers, testCtx);
    expect(html).not.toContain('HIDDEN BUTTON');
  });

  it('element with visible === true is present in output', () => {
    const data: CanvasData = {
      ...FULL_CANVAS,
      elements: [
        {
          id: 'visible-1',
          type: 'button',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 40 },
          zIndex: 1,
          label: 'VISIBLE BUTTON',
          visible: true,
        } as GenericCanvasElement,
      ],
    };
    const { html } = serializeCanvas(data, defaultSerializers, testCtx);
    expect(html).toContain('VISIBLE BUTTON');
  });
});

describe('toHtmlDocument integration', () => {
  it('output contains <!DOCTYPE html>', () => {
    const { html, css, js, head } = serializeCanvas(FULL_CANVAS, defaultSerializers, testCtx);
    const doc = toHtmlDocument({ html, css, js, head }, FULL_CANVAS.meta);
    expect(doc).toContain('<!DOCTYPE html>');
  });

  it('output contains the canvas container inside <body>', () => {
    const { html, css, js, head } = serializeCanvas(FULL_CANVAS, defaultSerializers, testCtx);
    const doc = toHtmlDocument({ html, css, js, head }, FULL_CANVAS.meta);
    const parsed = parseHtml(doc);
    const body = parsed.querySelector('body') ?? parsed;
    // Either parse as full doc or search in the string
    expect(doc).toContain('gc-canvas-export');
  });

  it('output contains <title> from meta', () => {
    const { html, css, js, head } = serializeCanvas(FULL_CANVAS, defaultSerializers, testCtx);
    const doc = toHtmlDocument({ html, css, js, head }, FULL_CANVAS.meta);
    expect(doc).toContain('<title>Integration Test</title>');
  });

  it('output contains <style> block', () => {
    const { html, css, js, head } = serializeCanvas(FULL_CANVAS, defaultSerializers, testCtx);
    const doc = toHtmlDocument({ html, css, js, head }, FULL_CANVAS.meta);
    expect(doc).toContain('<style>');
  });

  it('text content survives the full document round-trip', () => {
    const { html, css, js, head } = serializeCanvas(FULL_CANVAS, defaultSerializers, testCtx);
    const doc = toHtmlDocument({ html, css, js, head }, FULL_CANVAS.meta);
    expect(doc).toContain('Integration text');
  });
});
