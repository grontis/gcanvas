/**
 * Integration tests for CanvasStateService.
 *
 * Covers acceptance criteria that can be exercised programmatically:
 *   1. History stack — move → undo → position reverted → redo → position restored
 *   2. Remove element — add → remove → element gone from elements() signal
 *   3. Load snapshot — loadSnapshot() clears history, updates elements
 *   4. Resize min-size clamping — resize to 10x10 → clamped to 50x50
 *   5. Multiple undo/redo cycles — verify stack integrity
 *   6. canUndo/canRedo signal reactivity
 *   7. Change events carry correct canvasData snapshot
 */

import { TestBed } from '@angular/core/testing';
import { CanvasStateService } from './canvas-state.service';
import { CanvasData, CanvasChangeEvent } from '../models/canvas-data.model';
import { CanvasElement } from '../models/canvas-element.model';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTextElement(id: string, x = 0, y = 0, w = 100, h = 100): CanvasElement {
  return {
    id,
    type: 'text',
    position: { x, y },
    size: { width: w, height: h },
    zIndex: 1,
    content: { type: 'doc', content: [] },
  } as CanvasElement;
}

const BASE_SNAPSHOT: CanvasData = {
  version: 1,
  viewport: { width: 1200, height: 800 },
  elements: [],
};

// ---------------------------------------------------------------------------
// describe: History stack — undo/redo flow
// ---------------------------------------------------------------------------

describe('CanvasStateService integration — history stack', () => {
  let service: CanvasStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CanvasStateService] });
    service = TestBed.inject(CanvasStateService);
  });

  it('move → undo → position reverts to original', () => {
    service.addElement(makeTextElement('el-1', 10, 20));

    // Move element to new position
    service.moveElement('el-1', { x: 200, y: 300 });
    expect(service.elements()[0].position).toEqual({ x: 200, y: 300 });

    // Undo the move — position should revert to original
    service.undo();
    const el = service.elements().find(e => e.id === 'el-1');
    expect(el).toBeDefined();
    expect(el!.position).toEqual({ x: 10, y: 20 });
  });

  it('move → undo → redo → position restored', () => {
    service.addElement(makeTextElement('el-1', 10, 20));
    service.moveElement('el-1', { x: 200, y: 300 });

    // Undo
    service.undo();
    expect(service.elements()[0].position).toEqual({ x: 10, y: 20 });

    // Redo — position comes back
    service.redo();
    expect(service.elements()[0].position).toEqual({ x: 200, y: 300 });
  });

  it('undo undoes addElement — element list goes back to empty', () => {
    service.addElement(makeTextElement('el-1'));
    expect(service.elements().length).toBe(1);

    service.undo();
    expect(service.elements().length).toBe(0);
  });

  it('redo after undo-of-add restores element', () => {
    service.addElement(makeTextElement('el-1'));
    service.undo();
    expect(service.elements().length).toBe(0);

    service.redo();
    expect(service.elements().length).toBe(1);
    expect(service.elements()[0].id).toBe('el-1');
  });

  it('multiple sequential undo steps revert mutations in LIFO order', () => {
    service.addElement(makeTextElement('el-1', 0, 0));
    service.moveElement('el-1', { x: 100, y: 0 });
    service.moveElement('el-1', { x: 200, y: 0 });

    // Undo most recent move: should go to 100
    service.undo();
    expect(service.elements()[0].position.x).toBe(100);

    // Undo previous move: should go to 0
    service.undo();
    expect(service.elements()[0].position.x).toBe(0);
  });

  it('new mutation after undo clears redo stack', () => {
    service.addElement(makeTextElement('el-1'));
    service.moveElement('el-1', { x: 100, y: 0 });
    service.undo();

    expect(service.canRedo()).toBe(true);

    // New mutation should wipe the redo stack
    service.moveElement('el-1', { x: 999, y: 0 });
    expect(service.canRedo()).toBe(false);
  });

  it('canUndo is false after undoing all mutations', () => {
    service.addElement(makeTextElement('el-1'));
    service.undo();
    expect(service.canUndo()).toBe(false);
  });

  it('canRedo is false on a fresh service with no undo performed', () => {
    service.addElement(makeTextElement('el-1'));
    expect(service.canRedo()).toBe(false);
  });

  it('undo when history is empty does not throw', () => {
    expect(() => service.undo()).not.toThrow();
    expect(service.canUndo()).toBe(false);
  });

  it('redo when future is empty does not throw', () => {
    expect(() => service.redo()).not.toThrow();
    expect(service.canRedo()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// describe: Remove element
// ---------------------------------------------------------------------------

describe('CanvasStateService integration — removeElement', () => {
  let service: CanvasStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CanvasStateService] });
    service = TestBed.inject(CanvasStateService);
  });

  it('add then remove — element is gone from elements() signal', () => {
    service.addElement(makeTextElement('el-1'));
    expect(service.elements().length).toBe(1);

    service.removeElement('el-1');
    expect(service.elements().length).toBe(0);
    expect(service.elements().find(e => e.id === 'el-1')).toBeUndefined();
  });

  it('removing a non-existent id is a no-op and does not throw', () => {
    service.addElement(makeTextElement('el-1'));
    expect(() => service.removeElement('does-not-exist')).not.toThrow();
    expect(service.elements().length).toBe(1);
  });

  it('remove emits changeType "remove" with correct id', () => {
    // Subscribe BEFORE any mutations to capture all events synchronously
    const events: CanvasChangeEvent[] = [];
    service.changes$.subscribe(e => events.push(e));

    service.addElement(makeTextElement('el-1'));
    service.removeElement('el-1');

    expect(events.length).toBe(2);
    expect(events[1].changeType).toBe('remove');
    expect(events[1].changedElementIds).toContain('el-1');
  });

  it('remove is undoable — undo restores the element', () => {
    service.addElement(makeTextElement('el-2'));
    service.removeElement('el-2');
    expect(service.elements().length).toBe(0);

    service.undo();
    expect(service.elements().length).toBe(1);
    expect(service.elements()[0].id).toBe('el-2');
  });

  it('removing one of two elements leaves the other intact', () => {
    service.addElement(makeTextElement('el-1'));
    service.addElement(makeTextElement('el-2'));

    service.removeElement('el-1');

    expect(service.elements().length).toBe(1);
    expect(service.elements()[0].id).toBe('el-2');
  });
});

// ---------------------------------------------------------------------------
// describe: Load snapshot
// ---------------------------------------------------------------------------

describe('CanvasStateService integration — loadSnapshot', () => {
  let service: CanvasStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CanvasStateService] });
    service = TestBed.inject(CanvasStateService);
  });

  it('loadSnapshot replaces elements with snapshot contents', () => {
    const snapshot: CanvasData = {
      ...BASE_SNAPSHOT,
      elements: [makeTextElement('snap-el', 50, 50)],
    };
    service.addElement(makeTextElement('original'));
    service.loadSnapshot(snapshot);

    expect(service.elements().length).toBe(1);
    expect(service.elements()[0].id).toBe('snap-el');
  });

  it('loadSnapshot clears undo history', () => {
    service.addElement(makeTextElement('el-1'));
    expect(service.canUndo()).toBe(true);

    service.loadSnapshot(BASE_SNAPSHOT);
    expect(service.canUndo()).toBe(false);
  });

  it('loadSnapshot clears redo history', () => {
    service.addElement(makeTextElement('el-1'));
    service.undo(); // moves to redo stack
    expect(service.canRedo()).toBe(true);

    service.loadSnapshot(BASE_SNAPSHOT);
    expect(service.canRedo()).toBe(false);
  });

  it('after loadSnapshot, canUndo and canRedo are both false', () => {
    service.addElement(makeTextElement('x'));
    service.addElement(makeTextElement('y'));
    service.loadSnapshot(BASE_SNAPSHOT);

    expect(service.canUndo()).toBe(false);
    expect(service.canRedo()).toBe(false);
  });

  it('loadSnapshot updates the viewport', () => {
    const snapshot: CanvasData = {
      version: 2,
      viewport: { width: 1920, height: 1080 },
      elements: [],
    };
    service.loadSnapshot(snapshot);
    expect(service.canvasData().viewport.width).toBe(1920);
    expect(service.canvasData().viewport.height).toBe(1080);
  });

  it('loadSnapshot with empty elements results in empty elements()', () => {
    service.addElement(makeTextElement('el-1'));
    service.loadSnapshot(BASE_SNAPSHOT);
    expect(service.elements()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// describe: Resize minimum size clamping
// ---------------------------------------------------------------------------

describe('CanvasStateService integration — resize min-size clamping', () => {
  let service: CanvasStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CanvasStateService] });
    service = TestBed.inject(CanvasStateService);
  });

  it('resize to 10x10 is clamped to 50x50 (minimum enforced in service)', () => {
    service.addElement(makeTextElement('el-1', 0, 0, 200, 200));
    service.resizeElement('el-1', { x: 0, y: 0 }, { width: 10, height: 10 });

    const el = service.elements()[0];
    expect(el.size.width).toBe(50);
    expect(el.size.height).toBe(50);
  });

  it('resize to 0x0 is clamped to 50x50', () => {
    service.addElement(makeTextElement('el-1', 0, 0, 200, 200));
    service.resizeElement('el-1', { x: 0, y: 0 }, { width: 0, height: 0 });

    const el = service.elements()[0];
    expect(el.size.width).toBe(50);
    expect(el.size.height).toBe(50);
  });

  it('resize to negative dimensions is clamped to 50x50', () => {
    service.addElement(makeTextElement('el-1', 0, 0, 200, 200));
    service.resizeElement('el-1', { x: 0, y: 0 }, { width: -100, height: -50 });

    const el = service.elements()[0];
    expect(el.size.width).toBe(50);
    expect(el.size.height).toBe(50);
  });

  it('resize to exactly 50x50 is accepted (at boundary)', () => {
    service.addElement(makeTextElement('el-1', 0, 0, 200, 200));
    service.resizeElement('el-1', { x: 0, y: 0 }, { width: 50, height: 50 });

    const el = service.elements()[0];
    expect(el.size.width).toBe(50);
    expect(el.size.height).toBe(50);
  });

  it('resize above min-size is not clamped', () => {
    service.addElement(makeTextElement('el-1', 0, 0, 200, 200));
    service.resizeElement('el-1', { x: 5, y: 10 }, { width: 400, height: 300 });

    const el = service.elements()[0];
    expect(el.size.width).toBe(400);
    expect(el.size.height).toBe(300);
    expect(el.position).toEqual({ x: 5, y: 10 });
  });

  it('resize emits changeType "resize"', () => {
    // Subscribe BEFORE mutations — Subject.next() is synchronous
    const events: CanvasChangeEvent[] = [];
    service.changes$.subscribe(e => events.push(e));

    service.addElement(makeTextElement('el-1'));
    service.resizeElement('el-1', { x: 0, y: 0 }, { width: 300, height: 200 });

    expect(events.length).toBe(2);
    expect(events[1].changeType).toBe('resize');
    expect(events[1].changedElementIds).toContain('el-1');
  });

  it('resize is undoable — undo restores previous size', () => {
    service.addElement(makeTextElement('el-1', 0, 0, 200, 100));
    service.resizeElement('el-1', { x: 0, y: 0 }, { width: 400, height: 300 });
    expect(service.elements()[0].size).toEqual({ width: 400, height: 300 });

    service.undo();
    expect(service.elements()[0].size).toEqual({ width: 200, height: 100 });
  });
});

// ---------------------------------------------------------------------------
// describe: canUndo/canRedo signal reactivity
// ---------------------------------------------------------------------------

describe('CanvasStateService integration — canUndo/canRedo reactivity', () => {
  let service: CanvasStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CanvasStateService] });
    service = TestBed.inject(CanvasStateService);
  });

  it('canUndo becomes true after first mutation', () => {
    expect(service.canUndo()).toBe(false);
    service.addElement(makeTextElement('el-1'));
    expect(service.canUndo()).toBe(true);
  });

  it('canRedo becomes true after undo', () => {
    service.addElement(makeTextElement('el-1'));
    expect(service.canRedo()).toBe(false);
    service.undo();
    expect(service.canRedo()).toBe(true);
  });

  it('canRedo becomes false after redo consumes the only future entry', () => {
    service.addElement(makeTextElement('el-1'));
    service.undo();
    service.redo();
    expect(service.canRedo()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// describe: Change events carry correct canvasData snapshot
// ---------------------------------------------------------------------------

describe('CanvasStateService integration — change event canvasData', () => {
  let service: CanvasStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CanvasStateService] });
    service = TestBed.inject(CanvasStateService);
  });

  it('move event canvasData reflects the updated position', () => {
    // Subscribe BEFORE mutations — Subject.next() fires synchronously
    const events: CanvasChangeEvent[] = [];
    service.changes$.subscribe(e => events.push(e));

    service.addElement(makeTextElement('el-1', 0, 0));
    service.moveElement('el-1', { x: 50, y: 75 });

    expect(events.length).toBe(2);
    const moveEvent = events[1];
    const el = moveEvent.canvasData.elements.find(e => e.id === 'el-1');
    expect(el).toBeDefined();
    expect(el!.position).toEqual({ x: 50, y: 75 });
  });

  it('undo event has empty changedElementIds and changeType "viewport"', () => {
    // Subscribe BEFORE mutations — Subject.next() fires synchronously
    const events: CanvasChangeEvent[] = [];
    service.changes$.subscribe(e => events.push(e));

    service.addElement(makeTextElement('el-1'));
    service.undo();

    expect(events.length).toBe(2);
    expect(events[1].changeType).toBe('viewport');
    expect(events[1].changedElementIds).toEqual([]);
  });
});
