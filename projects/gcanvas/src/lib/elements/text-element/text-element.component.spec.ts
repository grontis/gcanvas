/**
 * Unit tests for TextElementComponent.
 *
 * Focus: exitEdit() idempotency guard (Phase 5 regression test).
 *
 * These tests exercise the component's class methods directly without
 * rendering the template, avoiding the need for a live TipTap editor
 * in the DOM. The component is instantiated via TestBed so that Angular
 * DI (inject(), input(), signal()) is fully wired.
 */

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TextElementComponent } from './text-element.component';
import { CanvasStateService } from '../../services/canvas-state.service';
import { SelectionService } from '../../services/selection.service';
import { TextCanvasElement } from '../../models/canvas-element.model';
import { TIPTAP_EXTENSIONS_TOKEN, DEFAULT_TIPTAP_EXTENSIONS } from '../../tokens/tiptap-extensions.token';

// ---------------------------------------------------------------------------
// Minimal host component — required to satisfy input.required<TextCanvasElement>()
// ---------------------------------------------------------------------------

const SAMPLE_ELEMENT: TextCanvasElement = {
  id: 'el-text-1',
  type: 'text',
  position: { x: 0, y: 0 },
  size: { width: 200, height: 100 },
  zIndex: 1,
  content: { type: 'doc', content: [] },
};

@Component({
  standalone: true,
  imports: [TextElementComponent],
  template: `<gc-text-element [element]="element" />`,
})
class HostComponent {
  element: TextCanvasElement = SAMPLE_ELEMENT;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// describe: exitEdit() idempotency
// ---------------------------------------------------------------------------

describe('TextElementComponent — exitEdit() idempotency', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        CanvasStateService,
        SelectionService,
        { provide: TIPTAP_EXTENSIONS_TOKEN, useValue: DEFAULT_TIPTAP_EXTENSIONS },
      ],
    });
  });

  it('exitEdit() when already in display mode (editMode=false) does not throw', () => {
    const hostFixture = TestBed.createComponent(HostComponent);
    hostFixture.detectChanges();

    const childEl = hostFixture.debugElement.children[0];
    const component = childEl.componentInstance as TextElementComponent;

    // Precondition: editMode is false (initial state)
    expect(component.editMode()).toBe(false);

    // Calling exitEdit() when not in edit mode must be a safe no-op
    expect(() => component.exitEdit()).not.toThrow();

    // State is unchanged after the no-op call
    expect(component.editMode()).toBe(false);
  });

  it('exitEdit() called twice in succession does not throw or corrupt state', () => {
    const hostFixture = TestBed.createComponent(HostComponent);
    hostFixture.detectChanges();

    const childEl = hostFixture.debugElement.children[0];
    const component = childEl.componentInstance as TextElementComponent;

    // Simulate entering edit mode by setting the signal directly (no real Editor)
    component.editMode.set(true);
    expect(component.editMode()).toBe(true);

    // First call: should exit cleanly
    expect(() => component.exitEdit()).not.toThrow();
    expect(component.editMode()).toBe(false);

    // Second call: guard should short-circuit; must not throw
    expect(() => component.exitEdit()).not.toThrow();
    expect(component.editMode()).toBe(false);
  });

  it('exitEdit() called twice does not call editor.destroy() more than once', () => {
    const hostFixture = TestBed.createComponent(HostComponent);
    hostFixture.detectChanges();

    const childEl = hostFixture.debugElement.children[0];
    const component = childEl.componentInstance as TextElementComponent;

    // Inject a spy editor
    const mockEditor = jasmine.createSpyObj('Editor', ['destroy']);
    component.editor = mockEditor;
    component.editMode.set(true);

    // First exitEdit() — should call destroy once
    component.exitEdit();
    expect(mockEditor.destroy).toHaveBeenCalledTimes(1);
    expect(component.editMode()).toBe(false);
    expect(component.editor).toBeNull();

    // Second exitEdit() — guard fires; destroy must NOT be called again
    component.exitEdit();
    expect(mockEditor.destroy).toHaveBeenCalledTimes(1);
  });

  it('ngOnDestroy() calls exitEdit() safely even when not in edit mode', () => {
    const hostFixture = TestBed.createComponent(HostComponent);
    hostFixture.detectChanges();

    const childEl = hostFixture.debugElement.children[0];
    const component = childEl.componentInstance as TextElementComponent;

    // Precondition: display mode
    expect(component.editMode()).toBe(false);

    // ngOnDestroy internally calls exitEdit() — must not throw
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('debounce timer is cleared on exitEdit() and does not fire after exit', (done) => {
    const hostFixture = TestBed.createComponent(HostComponent);
    hostFixture.detectChanges();

    const childEl = hostFixture.debugElement.children[0];
    const component = childEl.componentInstance as TextElementComponent;

    const mockEditor = jasmine.createSpyObj('Editor', ['destroy']);
    component.editor = mockEditor;
    component.editMode.set(true);

    // Manually plant a debounce timer (simulating an in-flight content update)
    let timerFired = false;
    (component as any)._debounceTimer = setTimeout(() => {
      timerFired = true;
    }, 50);

    // exitEdit() must cancel the timer
    component.exitEdit();

    // After the timer would have fired, verify it did not run
    setTimeout(() => {
      expect(timerFired).toBe(false);
      done();
    }, 100);
  });
});
