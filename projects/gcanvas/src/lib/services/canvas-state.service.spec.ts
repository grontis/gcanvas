/**
 * Unit tests for CanvasStateService.
 *
 * Runs without TestBed — service is instantiated directly.
 * Uses Angular's runInInjectionContext + EnvironmentInjector to support signals
 * created via computed() which require an injection context.
 */

import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CanvasStateService } from './canvas-state.service';
import { CanvasData, CanvasChangeEvent } from '../models/canvas-data.model';
import { CanvasElement } from '../models/canvas-element.model';

const SAMPLE_DATA: CanvasData = {
  version: 1,
  viewport: { width: 800, height: 600 },
  elements: [
    {
      id: 'el-1',
      type: 'text',
      position: { x: 10, y: 20 },
      size: { width: 200, height: 100 },
      zIndex: 1,
      content: { type: 'doc', content: [] },
    } as CanvasElement,
  ],
};

function makeElement(id: string): CanvasElement {
  return {
    id,
    type: 'text',
    position: { x: 0, y: 0 },
    size: { width: 100, height: 100 },
    zIndex: 1,
    content: { type: 'doc', content: [] },
  } as CanvasElement;
}

describe('CanvasStateService', () => {
  let service: CanvasStateService;
  let injector: EnvironmentInjector;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CanvasStateService],
    });
    service = TestBed.inject(CanvasStateService);
    injector = TestBed.inject(EnvironmentInjector);
  });

  // --- Initial state ---

  it('should have an empty element list initially', () => {
    expect(service.elements()).toEqual([]);
  });

  it('should have canUndo false initially', () => {
    expect(service.canUndo()).toBe(false);
  });

  it('should have canRedo false initially', () => {
    expect(service.canRedo()).toBe(false);
  });

  // --- loadSnapshot ---

  it('loadSnapshot should replace elements and reset history', () => {
    service.addElement(makeElement('pre-load'));
    service.loadSnapshot(SAMPLE_DATA);

    expect(service.elements().length).toBe(1);
    expect(service.elements()[0].id).toBe('el-1');
    expect(service.canUndo()).toBe(false);
    expect(service.canRedo()).toBe(false);
  });

  it('loadSnapshot should update canvasData signal', () => {
    service.loadSnapshot(SAMPLE_DATA);
    expect(service.canvasData().viewport.width).toBe(800);
  });

  // --- addElement ---

  it('addElement should append element to the list', () => {
    const el = makeElement('new-el');
    service.addElement(el);
    expect(service.elements().length).toBe(1);
    expect(service.elements()[0].id).toBe('new-el');
  });

  it('addElement should emit a CanvasChangeEvent with changeType "add"', done => {
    const el = makeElement('new-el');
    service.changes$.subscribe((event: CanvasChangeEvent) => {
      expect(event.changeType).toBe('add');
      expect(event.changedElementIds).toContain('new-el');
      expect(event.canvasData.elements.length).toBe(1);
      done();
    });
    service.addElement(el);
  });

  it('addElement should push to history (canUndo becomes true)', () => {
    service.addElement(makeElement('a'));
    expect(service.canUndo()).toBe(true);
  });

  // --- removeElement ---

  it('removeElement should remove the element', () => {
    service.addElement(makeElement('r1'));
    service.addElement(makeElement('r2'));
    service.removeElement('r1');
    expect(service.elements().map(e => e.id)).toEqual(['r2']);
  });

  it('removeElement should emit changeType "remove"', () => {
    const events: CanvasChangeEvent[] = [];
    service.changes$.subscribe(e => events.push(e));
    service.addElement(makeElement('r1'));  // events[0] — add
    service.removeElement('r1');           // events[1] — remove
    expect(events[1].changeType).toBe('remove');
    expect(events[1].changedElementIds).toContain('r1');
    expect(events.length).toBe(2);
  });

  // --- moveElement ---

  it('moveElement should update element position', () => {
    service.addElement(makeElement('m1'));
    service.moveElement('m1', { x: 50, y: 75 });
    expect(service.elements()[0].position).toEqual({ x: 50, y: 75 });
  });

  it('moveElement should emit changeType "move"', () => {
    const events: CanvasChangeEvent[] = [];
    service.changes$.subscribe(e => events.push(e));
    service.addElement(makeElement('m1'));      // events[0] — add
    service.moveElement('m1', { x: 1, y: 2 }); // events[1] — move
    expect(events[1].changeType).toBe('move');
    expect(events.length).toBe(2);
  });

  // --- resizeElement ---

  it('resizeElement should update element size and position', () => {
    service.addElement(makeElement('sz1'));
    service.resizeElement('sz1', { x: 5, y: 5 }, { width: 300, height: 200 });
    const el = service.elements()[0];
    expect(el.size).toEqual({ width: 300, height: 200 });
    expect(el.position).toEqual({ x: 5, y: 5 });
  });

  it('resizeElement should enforce minimum size of 50px', () => {
    service.addElement(makeElement('sz2'));
    service.resizeElement('sz2', { x: 0, y: 0 }, { width: 10, height: 5 });
    const el = service.elements()[0];
    expect(el.size.width).toBe(50);
    expect(el.size.height).toBe(50);
  });

  // --- updateContent ---

  it('updateContent should update element content', () => {
    service.addElement(makeElement('c1'));
    const newContent = { type: 'doc', content: [{ type: 'paragraph' }] };
    service.updateContent('c1', newContent);
    const el = service.elements()[0] as any;
    expect(el.content).toEqual(newContent);
  });

  it('updateContent should emit changeType "edit"', () => {
    const events: CanvasChangeEvent[] = [];
    service.changes$.subscribe(e => events.push(e));
    service.addElement(makeElement('c1'));  // events[0] — add
    service.updateContent('c1', {});       // events[1] — edit
    expect(events[1].changeType).toBe('edit');
    expect(events.length).toBe(2);
  });

  // --- reorderElement ---

  it('reorderElement should update zIndex', () => {
    service.addElement(makeElement('z1'));
    service.reorderElement('z1', 5);
    expect(service.elements()[0].zIndex).toBe(5);
  });

  // --- undo / redo ---

  it('undo should revert the last mutation', () => {
    service.addElement(makeElement('u1'));
    service.moveElement('u1', { x: 99, y: 99 });
    service.undo();
    expect(service.elements()[0].position).toEqual({ x: 0, y: 0 });
  });

  it('undo should make canRedo true', () => {
    service.addElement(makeElement('u1'));
    service.undo();
    expect(service.canRedo()).toBe(true);
  });

  it('undo on empty history should not throw', () => {
    expect(() => service.undo()).not.toThrow();
  });

  it('redo should reapply the undone mutation', () => {
    service.addElement(makeElement('r1'));
    service.moveElement('r1', { x: 55, y: 55 });
    service.undo();
    service.redo();
    expect(service.elements()[0].position).toEqual({ x: 55, y: 55 });
  });

  it('redo on empty future should not throw', () => {
    expect(() => service.redo()).not.toThrow();
  });

  it('new mutation after undo should clear redo stack', () => {
    service.addElement(makeElement('a1'));
    service.addElement(makeElement('a2'));
    service.undo();
    expect(service.canRedo()).toBe(true);
    service.addElement(makeElement('a3')); // new mutation clears redo
    expect(service.canRedo()).toBe(false);
  });

  it('undo/redo should emit changeType "viewport"', () => {
    const events: CanvasChangeEvent[] = [];
    service.changes$.subscribe(e => events.push(e));
    service.addElement(makeElement('u1')); // events[0] — add
    service.undo();                        // events[1] — viewport
    expect(events[1].changeType).toBe('viewport');
    expect(events.length).toBe(2);
  });

  // --- History limit ---

  it('should not exceed HISTORY_LIMIT (50) entries', () => {
    // Add 55 elements — history should be capped at 50
    for (let i = 0; i < 55; i++) {
      service.addElement(makeElement(`el-${i}`));
    }
    // Verify canUndo still works (limited history, not empty)
    expect(service.canUndo()).toBe(true);
    // Undo 50 times should succeed without error
    for (let i = 0; i < 50; i++) {
      service.undo();
    }
    // 51st undo should be a no-op (history exhausted)
    expect(service.canUndo()).toBe(false);
  });

  // --- Immutability ---

  it('mutations should not mutate the previous state reference', () => {
    service.addElement(makeElement('im1'));
    const before = service.elements();
    service.moveElement('im1', { x: 100, y: 100 });
    const after = service.elements();
    // Different array references (immutable update)
    expect(before).not.toBe(after);
  });
});
