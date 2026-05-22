/**
 * Unit tests for pure serializer functions — no TestBed, no Angular DI.
 * Tests:
 *   - serializeTextElement
 *   - serializeImageElement
 *   - serializeButtonElement
 *   - serializeShapeElement
 *   - serializeCanvas (assembler)
 *   - toHtmlDocument
 */

import { serializeTextElement } from './element-serializers/text.serializer';
import { serializeImageElement } from './element-serializers/image.serializer';
import { serializeButtonElement } from './element-serializers/button.serializer';
import { serializeShapeElement } from './element-serializers/shape.serializer';
import { serializeCanvas, toHtmlDocument } from './canvas-serializer';

import { DEFAULT_TIPTAP_EXTENSIONS } from '../tokens/tiptap-extensions.token';
import type { TextCanvasElement, ImageCanvasElement, GenericCanvasElement } from '../models/canvas-element.model';
import type { CanvasData } from '../models/canvas-data.model';
import type { SerializerContext, ElementSerializerEntry } from '../tokens/element-serializer.token';

// ---------------------------------------------------------------------------
// Shared test context
// ---------------------------------------------------------------------------

const identityResolver = (src: string, _el: ImageCanvasElement) => src;

const testCtx: SerializerContext = {
  tiptapExtensions: DEFAULT_TIPTAP_EXTENSIONS,
  resolveImage: identityResolver,
};

function makeTextEl(overrides: Partial<TextCanvasElement> = {}): TextCanvasElement {
  return {
    id: 'text-1',
    type: 'text',
    position: { x: 10, y: 20 },
    size: { width: 300, height: 100 },
    zIndex: 1,
    content: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
    },
    ...overrides,
  };
}

function makeImageEl(overrides: Partial<ImageCanvasElement> = {}): ImageCanvasElement {
  return {
    id: 'img-1',
    type: 'image',
    position: { x: 50, y: 60 },
    size: { width: 200, height: 150 },
    zIndex: 2,
    src: 'https://example.com/photo.jpg',
    alt: 'A photo',
    objectFit: 'cover',
    ...overrides,
  };
}

function makeButtonEl(overrides: Partial<GenericCanvasElement> = {}): GenericCanvasElement {
  return {
    id: 'btn-1',
    type: 'button',
    position: { x: 100, y: 200 },
    size: { width: 160, height: 44 },
    zIndex: 3,
    label: 'Click me',
    ...overrides,
  };
}

function makeShapeEl(overrides: Partial<GenericCanvasElement> = {}): GenericCanvasElement {
  return {
    id: 'shape-1',
    type: 'shape',
    position: { x: 0, y: 0 },
    size: { width: 400, height: 300 },
    zIndex: 1,
    fill: '#ff0000',
    borderRadius: 8,
    ...overrides,
  };
}

const BASE_VIEWPORT: CanvasData['viewport'] = {
  width: 1200,
  height: 800,
  backgroundColor: '#ffffff',
};

// ---------------------------------------------------------------------------
// serializeTextElement
// ---------------------------------------------------------------------------

describe('serializeTextElement', () => {
  it('produces html containing the text content', () => {
    const el = makeTextEl();
    const { html } = serializeTextElement(el, testCtx);
    expect(html).toContain('Hello');
  });

  it('wraps content in an absolute-positioned container div', () => {
    const el = makeTextEl();
    const { html } = serializeTextElement(el, testCtx);
    expect(html).toContain('position:absolute');
    expect(html).toContain('left:10px');
    expect(html).toContain('top:20px');
    expect(html).toContain('width:300px');
    expect(html).toContain('height:100px');
    expect(html).toContain('z-index:1');
  });

  it('includes overflow:hidden', () => {
    const { html } = serializeTextElement(makeTextEl(), testCtx);
    expect(html).toContain('overflow:hidden');
  });

  it('applies el.styles overrides to the container', () => {
    const el = makeTextEl({ styles: { color: 'red', 'font-size': '24px' } });
    const { html } = serializeTextElement(el, testCtx);
    expect(html).toContain('color:red');
    expect(html).toContain('font-size:24px');
  });

  it('handles empty content (paragraph with no text)', () => {
    const el = makeTextEl({
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
    });
    const { html } = serializeTextElement(el, testCtx);
    expect(html).toBeTruthy();
    expect(html).toContain('<div');
  });

  it('returns no css field (pure inline styles)', () => {
    const fragment = serializeTextElement(makeTextEl(), testCtx);
    expect(fragment.css).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// serializeImageElement
// ---------------------------------------------------------------------------

describe('serializeImageElement', () => {
  it('renders an img tag with correct src and alt', () => {
    const el = makeImageEl();
    const { html } = serializeImageElement(el, testCtx);
    expect(html).toContain('src="https://example.com/photo.jpg"');
    expect(html).toContain('alt="A photo"');
  });

  it('applies absolute positioning', () => {
    const { html } = serializeImageElement(makeImageEl(), testCtx);
    expect(html).toContain('position:absolute');
    expect(html).toContain('left:50px');
    expect(html).toContain('top:60px');
    expect(html).toContain('width:200px');
    expect(html).toContain('height:150px');
  });

  it('uses objectFit from element', () => {
    const el = makeImageEl({ objectFit: 'contain' });
    const { html } = serializeImageElement(el, testCtx);
    expect(html).toContain('object-fit:contain');
  });

  it('defaults to objectFit:cover when not specified', () => {
    const el = makeImageEl({ objectFit: undefined });
    const { html } = serializeImageElement(el, testCtx);
    expect(html).toContain('object-fit:cover');
  });

  it('renders a placeholder div when src is empty', () => {
    const el = makeImageEl({ src: '' });
    const { html } = serializeImageElement(el, testCtx);
    expect(html).not.toContain('<img');
    expect(html).toContain('<div');
    expect(html).toContain('background:#e5e7eb');
  });

  it('calls resolveImage with the src', () => {
    const resolvedSrcs: string[] = [];
    const ctx: SerializerContext = {
      ...testCtx,
      resolveImage: (src, el) => {
        resolvedSrcs.push(src);
        return 'https://cdn.example.com/resolved.jpg';
      },
    };
    const { html } = serializeImageElement(makeImageEl(), ctx);
    expect(resolvedSrcs).toContain('https://example.com/photo.jpg');
    expect(html).toContain('https://cdn.example.com/resolved.jpg');
  });

  it('does not call resolveImage when src is empty', () => {
    let called = false;
    const ctx: SerializerContext = {
      ...testCtx,
      resolveImage: () => { called = true; return ''; },
    };
    serializeImageElement(makeImageEl({ src: '' }), ctx);
    expect(called).toBe(false);
  });

  it('applies el.styles overrides', () => {
    const el = makeImageEl({ styles: { opacity: '0.8' } });
    const { html } = serializeImageElement(el, testCtx);
    expect(html).toContain('opacity:0.8');
  });

  it('uses object-position from el.styles', () => {
    const el = makeImageEl({ styles: { 'object-position': 'top left' } });
    const { html } = serializeImageElement(el, testCtx);
    expect(html).toContain('object-position:top left');
  });

  // URL protocol safety tests
  it('renders a placeholder when src uses javascript: protocol', () => {
    const el = makeImageEl({ src: 'javascript:alert(1)' });
    const { html } = serializeImageElement(el, testCtx);
    expect(html).not.toContain('<img');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('<div');
    expect(html).toContain('background:#e5e7eb');
  });

  it('renders a placeholder for javascript: protocol regardless of case', () => {
    const el = makeImageEl({ src: 'JAVASCRIPT:alert(1)' });
    const { html } = serializeImageElement(el, testCtx);
    expect(html).not.toContain('<img');
    expect(html).not.toContain('JAVASCRIPT:');
    expect(html).toContain('background:#e5e7eb');
  });

  it('renders a placeholder when src uses data: protocol', () => {
    const el = makeImageEl({ src: 'data:text/html,<script>alert(1)</script>' });
    const { html } = serializeImageElement(el, testCtx);
    expect(html).not.toContain('<img');
    expect(html).not.toContain('data:text/html');
    expect(html).toContain('background:#e5e7eb');
  });

  it('renders a placeholder when src uses vbscript: protocol', () => {
    const el = makeImageEl({ src: 'vbscript:msgbox(1)' });
    const { html } = serializeImageElement(el, testCtx);
    expect(html).not.toContain('<img');
    expect(html).not.toContain('vbscript:');
    expect(html).toContain('background:#e5e7eb');
  });

  it('allows safe https URLs through', () => {
    const el = makeImageEl({ src: 'https://example.com/x.png' });
    const { html } = serializeImageElement(el, testCtx);
    expect(html).toContain('<img');
    expect(html).toContain('src="https://example.com/x.png"');
  });

  it('allows safe http URLs through', () => {
    const el = makeImageEl({ src: 'http://example.com/x.png' });
    const { html } = serializeImageElement(el, testCtx);
    expect(html).toContain('<img');
    expect(html).toContain('src="http://example.com/x.png"');
  });

  it('allows relative/local URLs through', () => {
    const el = makeImageEl({ src: '/local/path.png' });
    const { html } = serializeImageElement(el, testCtx);
    expect(html).toContain('<img');
    expect(html).toContain('src="/local/path.png"');
  });

  it('renders a placeholder when the resolver returns a javascript: URL even if raw src was safe', () => {
    const ctx: SerializerContext = {
      ...testCtx,
      resolveImage: () => 'javascript:alert("hacked")',
    };
    const el = makeImageEl({ src: 'https://example.com/safe.png' });
    const { html } = serializeImageElement(el, ctx);
    expect(html).not.toContain('<img');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('background:#e5e7eb');
  });
});

// ---------------------------------------------------------------------------
// serializeButtonElement
// ---------------------------------------------------------------------------

describe('serializeButtonElement', () => {
  it('renders a button element with the label as text content', () => {
    const el = makeButtonEl();
    const { html } = serializeButtonElement(el, testCtx);
    expect(html).toContain('<button');
    expect(html).toContain('Click me');
  });

  it('uses "Button" as default label when none provided', () => {
    const el = makeButtonEl({ label: undefined });
    const { html } = serializeButtonElement(el, testCtx);
    expect(html).toContain('Button');
  });

  it('applies absolute positioning', () => {
    const { html } = serializeButtonElement(makeButtonEl(), testCtx);
    expect(html).toContain('position:absolute');
    expect(html).toContain('left:100px');
    expect(html).toContain('top:200px');
    expect(html).toContain('width:160px');
    expect(html).toContain('height:44px');
  });

  it('button has default blue background style', () => {
    const { html } = serializeButtonElement(makeButtonEl(), testCtx);
    expect(html).toContain('background:#2563eb');
    expect(html).toContain('color:#fff');
  });

  it('applies el.styles overrides to the container', () => {
    const el = makeButtonEl({ styles: { opacity: '0.5' } });
    const { html } = serializeButtonElement(el, testCtx);
    expect(html).toContain('opacity:0.5');
  });

  it('escapes HTML in the label', () => {
    const el = makeButtonEl({ label: '<script>alert("x")</script>' });
    const { html } = serializeButtonElement(el, testCtx);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

// ---------------------------------------------------------------------------
// serializeShapeElement
// ---------------------------------------------------------------------------

describe('serializeShapeElement', () => {
  it('applies the fill color as background-color', () => {
    const { html } = serializeShapeElement(makeShapeEl(), testCtx);
    expect(html).toContain('background-color:#ff0000');
  });

  it('defaults to #d1d5db fill when none provided', () => {
    const el = makeShapeEl({ fill: undefined });
    const { html } = serializeShapeElement(el, testCtx);
    expect(html).toContain('background-color:#d1d5db');
  });

  it('applies borderRadius', () => {
    const { html } = serializeShapeElement(makeShapeEl(), testCtx);
    expect(html).toContain('border-radius:8px');
  });

  it('defaults borderRadius to 0', () => {
    const el = makeShapeEl({ borderRadius: undefined });
    const { html } = serializeShapeElement(el, testCtx);
    expect(html).toContain('border-radius:0px');
  });

  it('applies absolute positioning', () => {
    const { html } = serializeShapeElement(makeShapeEl(), testCtx);
    expect(html).toContain('position:absolute');
    expect(html).toContain('left:0px');
    expect(html).toContain('top:0px');
    expect(html).toContain('width:400px');
    expect(html).toContain('height:300px');
  });

  it('applies el.styles overrides', () => {
    const el = makeShapeEl({ styles: { opacity: '0.7' } });
    const { html } = serializeShapeElement(el, testCtx);
    expect(html).toContain('opacity:0.7');
  });
});

// ---------------------------------------------------------------------------
// serializeCanvas (assembler)
// ---------------------------------------------------------------------------

describe('serializeCanvas', () => {
  const makeSerializers = (): ElementSerializerEntry[] => [
    { type: 'text',   serialize: (el, ctx) => serializeTextElement(el as TextCanvasElement, ctx) },
    { type: 'image',  serialize: (el, ctx) => serializeImageElement(el as ImageCanvasElement, ctx) },
    { type: 'button', serialize: (el, ctx) => serializeButtonElement(el as GenericCanvasElement, ctx) },
    { type: 'shape',  serialize: (el, ctx) => serializeShapeElement(el as GenericCanvasElement, ctx) },
  ];

  it('produces html containing the canvas container', () => {
    const data: CanvasData = { version: 1, viewport: BASE_VIEWPORT, elements: [] };
    const { html } = serializeCanvas(data, makeSerializers(), testCtx);
    expect(html).toContain('gc-canvas-export');
    expect(html).toContain('position:relative');
    expect(html).toContain('width:1200px');
    expect(html).toContain('height:800px');
  });

  it('includes background-color from viewport', () => {
    const data: CanvasData = {
      version: 1,
      viewport: { ...BASE_VIEWPORT, backgroundColor: '#f0f0f0' },
      elements: [],
    };
    const { html } = serializeCanvas(data, makeSerializers(), testCtx);
    expect(html).toContain('background-color:#f0f0f0');
  });

  it('serializes a single text element', () => {
    const data: CanvasData = {
      version: 1,
      viewport: BASE_VIEWPORT,
      elements: [makeTextEl()],
    };
    const { html } = serializeCanvas(data, makeSerializers(), testCtx);
    expect(html).toContain('Hello');
  });

  it('serializes multiple elements', () => {
    const data: CanvasData = {
      version: 1,
      viewport: BASE_VIEWPORT,
      elements: [
        makeTextEl(),
        makeImageEl(),
        makeButtonEl(),
        makeShapeEl(),
      ],
    };
    const { html } = serializeCanvas(data, makeSerializers(), testCtx);
    expect(html).toContain('Hello');
    expect(html).toContain('<img');
    expect(html).toContain('<button');
    expect(html).toContain('background-color:#ff0000');
  });

  it('skips elements with visible === false', () => {
    const data: CanvasData = {
      version: 1,
      viewport: BASE_VIEWPORT,
      elements: [
        makeTextEl({ visible: false }),
        makeButtonEl(),
      ],
    };
    const { html } = serializeCanvas(data, makeSerializers(), testCtx);
    expect(html).not.toContain('Hello');
    expect(html).toContain('<button');
  });

  it('emits an HTML comment for unknown element types', () => {
    const data: CanvasData = {
      version: 1,
      viewport: BASE_VIEWPORT,
      elements: [{ id: 'x', type: 'carousel', position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, zIndex: 1 }],
    };
    const { html } = serializeCanvas(data, makeSerializers(), testCtx);
    expect(html).toContain('<!-- unknown element type: carousel -->');
  });

  it('last matching serializer wins (override mechanism)', () => {
    const serializers: ElementSerializerEntry[] = [
      ...makeSerializers(),
      { type: 'text', serialize: () => ({ html: '<div class="custom-text">OVERRIDDEN</div>' }) },
    ];
    const data: CanvasData = {
      version: 1,
      viewport: BASE_VIEWPORT,
      elements: [makeTextEl()],
    };
    const { html } = serializeCanvas(data, serializers, testCtx);
    expect(html).toContain('OVERRIDDEN');
    expect(html).not.toContain('Hello');
  });

  it('deduplicates css fragments', () => {
    const sharedCss = '.shared { color: red; }';
    const serializers: ElementSerializerEntry[] = [
      { type: 'text', serialize: () => ({ html: '<p>a</p>', css: sharedCss }) },
    ];
    const data: CanvasData = {
      version: 1,
      viewport: BASE_VIEWPORT,
      elements: [makeTextEl(), makeTextEl({ id: 'text-2' })],
    };
    const { css } = serializeCanvas(data, serializers, testCtx);
    const occurrences = (css.match(/\.shared/g) ?? []).length;
    expect(occurrences).toBe(1);
  });

  it('handles empty elements array', () => {
    const data: CanvasData = { version: 1, viewport: BASE_VIEWPORT, elements: [] };
    const { html } = serializeCanvas(data, makeSerializers(), testCtx);
    expect(html).toContain('gc-canvas-export');
  });

  it('includes viewport padding as CSS when padding is a number', () => {
    const data: CanvasData = {
      version: 1,
      viewport: { ...BASE_VIEWPORT, padding: 16 },
      elements: [],
    };
    const { html } = serializeCanvas(data, makeSerializers(), testCtx);
    expect(html).toContain('padding:16px');
  });

  it('includes viewport padding as CSS when padding is an object', () => {
    const data: CanvasData = {
      version: 1,
      viewport: { ...BASE_VIEWPORT, padding: { x: 32, y: 16 } },
      elements: [],
    };
    const { html } = serializeCanvas(data, makeSerializers(), testCtx);
    expect(html).toContain('padding:16px 32px');
  });

  it('returns js when a fragment provides js', () => {
    const serializers: ElementSerializerEntry[] = [
      { type: 'text', serialize: () => ({ html: '<p>x</p>', js: 'console.log("hi");' }) },
    ];
    const data: CanvasData = {
      version: 1,
      viewport: BASE_VIEWPORT,
      elements: [makeTextEl()],
    };
    const result = serializeCanvas(data, serializers, testCtx);
    expect(result.js).toBe('console.log("hi");');
  });

  it('returns undefined js when no fragments provide js', () => {
    const data: CanvasData = {
      version: 1,
      viewport: BASE_VIEWPORT,
      elements: [makeTextEl()],
    };
    const result = serializeCanvas(data, makeSerializers(), testCtx);
    expect(result.js).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// toHtmlDocument
// ---------------------------------------------------------------------------

describe('toHtmlDocument', () => {
  it('starts with <!DOCTYPE html>', () => {
    const result = toHtmlDocument({ html: '<div>hi</div>', css: '' });
    expect(result.startsWith('<!DOCTYPE html>')).toBe(true);
  });

  it('includes the seoTitle in <title>', () => {
    const result = toHtmlDocument({ html: '', css: '' }, { seoTitle: 'My Page' });
    expect(result).toContain('<title>My Page</title>');
  });

  it('includes the seoDescription in meta', () => {
    const result = toHtmlDocument({ html: '', css: '' }, { seoDescription: 'A description' });
    expect(result).toContain('content="A description"');
  });

  it('includes <style> block', () => {
    const result = toHtmlDocument({ html: '<div>hi</div>', css: '.foo { color: red; }' });
    expect(result).toContain('<style>');
    expect(result).toContain('.foo { color: red; }');
  });

  it('includes base reset in <style>', () => {
    const result = toHtmlDocument({ html: '', css: '' });
    expect(result).toContain('box-sizing: border-box');
  });

  it('includes the html in <body>', () => {
    const result = toHtmlDocument({ html: '<div class="my-canvas">content</div>', css: '' });
    expect(result).toContain('<div class="my-canvas">content</div>');
  });

  it('includes <script> block when js is provided', () => {
    const result = toHtmlDocument({ html: '', css: '', js: 'alert("hello");' });
    expect(result).toContain('<script>');
    expect(result).toContain('alert("hello");');
  });

  it('does not include <script> when js is absent', () => {
    const result = toHtmlDocument({ html: '', css: '' });
    expect(result).not.toContain('<script>');
  });

  it('escapes </script> inside the JS block so HTML parser does not close early', () => {
    const result = toHtmlDocument({ html: '', css: '', js: 'var s = "</script>";' });
    // The escaped form should appear in the raw string — the backslash prevents HTML parser matching
    // Raw check: the backslash-escaped version must be in the serialized output
    expect(result).toContain('<\\/script>');
    // Verify the script block still terminates at the right place (body closes after script)
    expect(result.endsWith('</script></body></html>')).toBe(true);
  });

  it('includes head fragment when head is provided', () => {
    const result = toHtmlDocument({ html: '', css: '', head: '<link rel="stylesheet" href="fonts.css">' });
    expect(result).toContain('<link rel="stylesheet" href="fonts.css">');
  });

  it('handles empty meta', () => {
    const result = toHtmlDocument({ html: '', css: '' }, {});
    expect(result).toContain('<title></title>');
  });
});
