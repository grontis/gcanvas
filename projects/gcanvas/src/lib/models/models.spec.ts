/**
 * Integration / type-shape tests for the Phase 2 data model.
 *
 * These tests serve two purposes:
 *   1. Runtime: verify that object literals conforming to each interface are
 *      structurally correct (no missing required properties, correct shapes).
 *   2. Compile-time: the TypeScript compiler rejects this file if any type
 *      definition is malformed — so a green `ng test` or `ng build` is itself
 *      the type-correctness acceptance test.
 *
 * No Angular TestBed is needed — these are pure TypeScript types.
 */

import {
  BuiltInElementType,
  ElementPosition,
  ElementSize,
  BaseCanvasElement,
  TextCanvasElement,
  ImageCanvasElement,
  GenericCanvasElement,
  CanvasElement,
  CanvasViewport,
  CanvasData,
  CanvasChangeEvent,
} from './index';

// ---------------------------------------------------------------------------
// Helpers — typed const assignments force the compiler to validate shapes.
// ---------------------------------------------------------------------------

const pos: ElementPosition = { x: 10, y: 20 };
const size: ElementSize = { width: 100, height: 50 };

const textEl: TextCanvasElement = {
  id: 'el-1',
  type: 'text',
  position: pos,
  size,
  zIndex: 1,
  content: { type: 'doc', content: [] },
};

const imageEl: ImageCanvasElement = {
  id: 'el-2',
  type: 'image',
  position: pos,
  size,
  zIndex: 2,
  src: 'https://example.com/image.png',
  alt: 'example',
  objectFit: 'cover',
};

const genericEl: GenericCanvasElement = {
  id: 'el-3',
  type: 'custom-plugin',
  position: pos,
  size,
  zIndex: 3,
  customProp: 'value',
  anotherProp: 42,
};

const viewport: CanvasViewport = { width: 1920, height: 1080, backgroundColor: '#ffffff' };

const canvasData: CanvasData = {
  version: 1,
  viewport,
  elements: [textEl, imageEl, genericEl],
};

// ---------------------------------------------------------------------------
// describe: ElementPosition
// ---------------------------------------------------------------------------

describe('ElementPosition', () => {
  it('should have numeric x and y', () => {
    expect(typeof pos.x).toBe('number');
    expect(typeof pos.y).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// describe: ElementSize
// ---------------------------------------------------------------------------

describe('ElementSize', () => {
  it('should have numeric width and height', () => {
    expect(typeof size.width).toBe('number');
    expect(typeof size.height).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// describe: TextCanvasElement
// ---------------------------------------------------------------------------

describe('TextCanvasElement', () => {
  it('should have type literal "text"', () => {
    expect(textEl.type).toBe('text');
  });

  it('should have required BaseCanvasElement properties', () => {
    expect(typeof textEl.id).toBe('string');
    expect(textEl.position).toEqual(pos);
    expect(textEl.size).toEqual(size);
    expect(typeof textEl.zIndex).toBe('number');
  });

  it('should have a content property (JSONContent object)', () => {
    expect(textEl.content).toBeDefined();
    expect(typeof textEl.content).toBe('object');
  });

  it('optional locked and styles should be absent by default', () => {
    expect(textEl.locked).toBeUndefined();
    expect(textEl.styles).toBeUndefined();
  });

  it('should accept optional locked and styles when provided', () => {
    const withOptionals: TextCanvasElement = {
      ...textEl,
      locked: true,
      styles: { color: 'red' },
    };
    expect(withOptionals.locked).toBe(true);
    expect(withOptionals.styles).toEqual({ color: 'red' });
  });
});

// ---------------------------------------------------------------------------
// describe: ImageCanvasElement
// ---------------------------------------------------------------------------

describe('ImageCanvasElement', () => {
  it('should have type literal "image"', () => {
    expect(imageEl.type).toBe('image');
  });

  it('should have a non-empty src string', () => {
    expect(typeof imageEl.src).toBe('string');
    expect(imageEl.src.length).toBeGreaterThan(0);
  });

  it('should accept all objectFit values', () => {
    const fits: Array<ImageCanvasElement['objectFit']> = ['cover', 'contain', 'fill', 'none'];
    fits.forEach(fit => {
      const el: ImageCanvasElement = { ...imageEl, objectFit: fit };
      expect(el.objectFit).toBe(fit);
    });
  });

  it('alt and objectFit should be optional', () => {
    const minimal: ImageCanvasElement = {
      id: 'el-img-min',
      type: 'image',
      position: pos,
      size,
      zIndex: 0,
      src: 'https://example.com/img.png',
    };
    expect(minimal.alt).toBeUndefined();
    expect(minimal.objectFit).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// describe: GenericCanvasElement
// ---------------------------------------------------------------------------

describe('GenericCanvasElement', () => {
  it('should hold arbitrary extra properties via index signature', () => {
    expect(genericEl['customProp']).toBe('value');
    expect(genericEl['anotherProp']).toBe(42);
  });

  it('type should be a non-empty string (not limited to built-in literals)', () => {
    expect(typeof genericEl.type).toBe('string');
    expect(genericEl.type).toBe('custom-plugin');
  });
});

// ---------------------------------------------------------------------------
// describe: CanvasElement discriminated union narrowing
// ---------------------------------------------------------------------------

describe('CanvasElement discriminated union', () => {
  const elements: CanvasElement[] = [textEl, imageEl, genericEl];

  it('should contain three elements', () => {
    expect(elements.length).toBe(3);
  });

  it('should narrow to TextCanvasElement when type is "text"', () => {
    const found = elements.find(el => el.type === 'text');
    expect(found).toBeDefined();
    // Narrowing: access content only after type guard
    if (found && found.type === 'text') {
      expect(found.content).toBeDefined();
    }
  });

  it('should narrow to ImageCanvasElement when type is "image"', () => {
    const found = elements.find(el => el.type === 'image');
    expect(found).toBeDefined();
    if (found && found.type === 'image') {
      expect(found.src).toBeDefined();
    }
  });

  it('all elements should satisfy BaseCanvasElement shape', () => {
    elements.forEach(el => {
      expect(typeof el.id).toBe('string');
      expect(typeof el.type).toBe('string');
      expect(typeof el.zIndex).toBe('number');
      expect(el.position).toBeDefined();
      expect(el.size).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// describe: BuiltInElementType
// ---------------------------------------------------------------------------

describe('BuiltInElementType', () => {
  it('should cover "text" and "image" as valid literal values', () => {
    const text: BuiltInElementType = 'text';
    const image: BuiltInElementType = 'image';
    expect(text).toBe('text');
    expect(image).toBe('image');
  });
});

// ---------------------------------------------------------------------------
// describe: CanvasViewport
// ---------------------------------------------------------------------------

describe('CanvasViewport', () => {
  it('should have numeric width and height', () => {
    expect(typeof viewport.width).toBe('number');
    expect(typeof viewport.height).toBe('number');
  });

  it('should accept optional backgroundColor', () => {
    expect(viewport.backgroundColor).toBe('#ffffff');
  });

  it('backgroundColor should be optional', () => {
    const minimal: CanvasViewport = { width: 800, height: 600 };
    expect(minimal.backgroundColor).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// describe: CanvasData
// ---------------------------------------------------------------------------

describe('CanvasData', () => {
  it('version should be a number', () => {
    expect(typeof canvasData.version).toBe('number');
  });

  it('elements should be an array of CanvasElement', () => {
    expect(Array.isArray(canvasData.elements)).toBe(true);
    expect(canvasData.elements.length).toBe(3);
  });

  it('viewport should be a CanvasViewport', () => {
    expect(canvasData.viewport).toEqual(viewport);
  });

  it('elements array can be empty', () => {
    const empty: CanvasData = { version: 1, viewport, elements: [] };
    expect(empty.elements.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// describe: CanvasChangeEvent
// ---------------------------------------------------------------------------

describe('CanvasChangeEvent', () => {
  const allChangeTypes: CanvasChangeEvent['changeType'][] = [
    'move', 'resize', 'edit', 'add', 'remove', 'reorder', 'viewport',
  ];

  it('should accept all seven changeType literal values', () => {
    allChangeTypes.forEach(changeType => {
      const event: CanvasChangeEvent = {
        canvasData,
        changedElementIds: ['el-1'],
        changeType,
      };
      expect(event.changeType).toBe(changeType);
    });
  });

  it('changedElementIds should be an array of strings', () => {
    const event: CanvasChangeEvent = {
      canvasData,
      changedElementIds: ['el-1', 'el-2'],
      changeType: 'move',
    };
    expect(Array.isArray(event.changedElementIds)).toBe(true);
    event.changedElementIds.forEach(id => expect(typeof id).toBe('string'));
  });

  it('changedElementIds can be empty (for viewport-only changes)', () => {
    const event: CanvasChangeEvent = {
      canvasData,
      changedElementIds: [],
      changeType: 'viewport',
    };
    expect(event.changedElementIds.length).toBe(0);
  });

  it('canvasData should reference a valid CanvasData shape', () => {
    const event: CanvasChangeEvent = {
      canvasData,
      changedElementIds: [],
      changeType: 'add',
    };
    expect(typeof event.canvasData.version).toBe('number');
    expect(Array.isArray(event.canvasData.elements)).toBe(true);
  });
});
