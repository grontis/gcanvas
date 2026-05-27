/**
 * Unit and integration tests for the secret-page-integration feature (v0.3.0)
 *
 * Covers:
 *   - CanvasEditorComponent: enablePreview and enablePublish inputs present
 *   - ChromeTopComponent: enablePreview and enablePublish inputs present
 *   - CommandEntry: isAvailable predicate field typed correctly
 *   - CommandPaletteService.filteredCommands: excludes commands whose isAvailable() returns false
 *   - CommandPaletteService.filteredCommands: reactive — updates when predicate signal changes
 *   - CanvasEditorComponent.openPublishModal(): no-op when enablePublish=false
 *   - openPublishModal$.next() does NOT open modal when enablePublish=false
 *   - filteredCommands() excludes 'publish' when enablePublish=false (integration)
 *   - filteredCommands() includes 'publish' when enablePublish=true (default) (integration)
 *   - ChromeTopComponent: Publish button absent from DOM when enablePublish=false
 *   - ChromeTopComponent: Preview button absent from DOM when enablePreview=false
 */

import {
  TestBed,
  ComponentFixture,
} from '@angular/core/testing';
import { reflectComponentType, signal } from '@angular/core';

import { CanvasEditorComponent } from './editor/canvas-editor.component';
import { ChromeTopComponent } from './editor/chrome/chrome-top.component';
import { CommandPaletteService } from './services/command-palette.service';
import { EditorChromeService } from './services/editor-chrome.service';
import { COMMAND_REGISTRY_TOKEN, type CommandEntry } from './tokens/command-registry.token';
import { CanvasStateService } from './services/canvas-state.service';
import { SelectionService } from './services/selection.service';
import { SnapGuideService } from './services/snap-guide.service';
import { CanvasData } from './models/canvas-data.model';

const EMPTY_CANVAS: CanvasData = {
  version: 1,
  viewport: { width: 1200, height: 800 },
  elements: [],
};

// Helper to get a service from the component's own injector
function fromComponentInjector<T>(fixture: ComponentFixture<CanvasEditorComponent>, token: any): T {
  return fixture.debugElement.injector.get(token) as T;
}

// ---------------------------------------------------------------------------
// 1. CanvasEditorComponent inputs — reflectComponentType
// ---------------------------------------------------------------------------

describe('CanvasEditorComponent — enablePreview / enablePublish inputs', () => {
  it('should have enablePreview input', async () => {
    const { CanvasEditorComponent: comp } = await import('./editor/canvas-editor.component');
    const mirror = reflectComponentType(comp);
    expect(mirror?.inputs.some(i => i.propName === 'enablePreview')).toBe(true);
  });

  it('should have enablePublish input', async () => {
    const { CanvasEditorComponent: comp } = await import('./editor/canvas-editor.component');
    const mirror = reflectComponentType(comp);
    expect(mirror?.inputs.some(i => i.propName === 'enablePublish')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. ChromeTopComponent inputs — reflectComponentType
// ---------------------------------------------------------------------------

describe('ChromeTopComponent — enablePreview / enablePublish inputs', () => {
  it('should have enablePreview input', async () => {
    const { ChromeTopComponent: comp } = await import('./editor/chrome/chrome-top.component');
    const mirror = reflectComponentType(comp);
    expect(mirror?.inputs.some(i => i.propName === 'enablePreview')).toBe(true);
  });

  it('should have enablePublish input', async () => {
    const { ChromeTopComponent: comp } = await import('./editor/chrome/chrome-top.component');
    const mirror = reflectComponentType(comp);
    expect(mirror?.inputs.some(i => i.propName === 'enablePublish')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. CommandPaletteService — filteredCommands with isAvailable predicate
// ---------------------------------------------------------------------------

describe('CommandPaletteService filteredCommands with isAvailable', () => {
  let service: CommandPaletteService;
  const availableFlag = signal(false);

  const commands: CommandEntry[] = [
    { id: 'always-on', label: 'Always On', category: 'test', action: () => {} },
    { id: 'gated',     label: 'Gated',     category: 'test', action: () => {}, isAvailable: () => availableFlag() },
  ];

  beforeEach(() => {
    availableFlag.set(false);
    TestBed.configureTestingModule({
      providers: [
        CommandPaletteService,
        { provide: COMMAND_REGISTRY_TOKEN, useValue: commands },
      ],
    });
    service = TestBed.inject(CommandPaletteService);
  });

  it('excludes commands whose isAvailable() returns false', () => {
    const result = service.filteredCommands();
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('always-on');
  });

  it('includes commands whose isAvailable() returns true', () => {
    availableFlag.set(true);
    const result = service.filteredCommands();
    expect(result.length).toBe(2);
    const ids = result.map(c => c.id);
    expect(ids).toContain('always-on');
    expect(ids).toContain('gated');
  });

  it('filteredCommands() updates reactively when predicate signal changes', () => {
    // Initially gated command is excluded
    expect(service.filteredCommands().length).toBe(1);

    // Enable it
    availableFlag.set(true);
    expect(service.filteredCommands().length).toBe(2);

    // Disable again
    availableFlag.set(false);
    expect(service.filteredCommands().length).toBe(1);
  });

  it('commands without isAvailable are always included (treated as available)', () => {
    // 'always-on' has no isAvailable predicate — should always be present
    availableFlag.set(false);
    const result = service.filteredCommands();
    expect(result.some(c => c.id === 'always-on')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. CanvasEditorComponent enablePublish=false — method guard
// ---------------------------------------------------------------------------

describe('CanvasEditorComponent enablePublish=false — method guard', () => {
  let fixture: ComponentFixture<CanvasEditorComponent>;
  let component: CanvasEditorComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CanvasEditorComponent],
      providers: [
        CanvasStateService,
        SelectionService,
        SnapGuideService,
      ],
    });
    fixture = TestBed.createComponent(CanvasEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('canvasData', EMPTY_CANVAS);
    fixture.componentRef.setInput('enablePublish', false);
    fixture.detectChanges();
  });

  it('_publishOpen starts false', () => {
    expect(component._publishOpen()).toBe(false);
  });

  it('openPublishModal() is a no-op when enablePublish=false', () => {
    component.openPublishModal();
    fixture.detectChanges();
    expect(component._publishOpen()).toBe(false);
  });

  it('openPublishModal$.next() does NOT set _publishOpen when enablePublish=false', () => {
    const chrome = fromComponentInjector<EditorChromeService>(fixture, EditorChromeService);
    chrome.openPublishModal$.next();
    fixture.detectChanges();
    expect(component._publishOpen()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. Integration — filteredCommands excludes 'publish' when enablePublish=false
// ---------------------------------------------------------------------------

describe('Integration — publish command in filteredCommands', () => {
  let fixture: ComponentFixture<CanvasEditorComponent>;
  let component: CanvasEditorComponent;
  let el: HTMLElement;

  afterEach(() => {
    if (el?.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  function createFixture(enablePublish: boolean): void {
    TestBed.configureTestingModule({
      imports: [CanvasEditorComponent],
      providers: [
        CanvasStateService,
        SelectionService,
        SnapGuideService,
      ],
    });
    fixture = TestBed.createComponent(CanvasEditorComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('canvasData', EMPTY_CANVAS);
    fixture.componentRef.setInput('enablePublish', enablePublish);
    document.body.appendChild(el);
    fixture.detectChanges();
  }

  it('publish command is absent from filteredCommands when enablePublish=false', () => {
    createFixture(false);
    const palette = fromComponentInjector<CommandPaletteService>(fixture, CommandPaletteService);
    const ids = palette.filteredCommands().map(c => c.id);
    expect(ids).not.toContain('publish');
  });

  it('publish command is present in filteredCommands when enablePublish=true (default)', () => {
    createFixture(true);
    const palette = fromComponentInjector<CommandPaletteService>(fixture, CommandPaletteService);
    const ids = palette.filteredCommands().map(c => c.id);
    expect(ids).toContain('publish');
  });

  it('filteredCommands has 7 items when enablePublish=false (publish excluded)', () => {
    createFixture(false);
    const palette = fromComponentInjector<CommandPaletteService>(fixture, CommandPaletteService);
    expect(palette.filteredCommands().length).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// 6. ChromeTopComponent DOM — buttons absent when inputs are false
// ---------------------------------------------------------------------------

describe('ChromeTopComponent DOM — @if guards', () => {
  let fixture: ComponentFixture<ChromeTopComponent>;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ChromeTopComponent],
      providers: [
        EditorChromeService,
        CanvasStateService,
        SelectionService,
        SnapGuideService,
      ],
    });
    fixture = TestBed.createComponent(ChromeTopComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('Publish button present by default (enablePublish=true)', () => {
    expect(el.querySelector('.gc-btn-publish')).toBeTruthy();
  });

  it('Preview button present by default (enablePreview=true)', () => {
    // Preview button has gc-chrome-mini class and title="Preview"
    const preview = el.querySelector('button[title="Preview"]');
    expect(preview).toBeTruthy();
  });

  it('Publish button absent when enablePublish=false', () => {
    fixture.componentRef.setInput('enablePublish', false);
    fixture.detectChanges();
    expect(el.querySelector('.gc-btn-publish')).toBeNull();
  });

  it('Preview button absent when enablePreview=false', () => {
    fixture.componentRef.setInput('enablePreview', false);
    fixture.detectChanges();
    expect(el.querySelector('button[title="Preview"]')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 7. EditorChromeService — publishEnabled signal
// ---------------------------------------------------------------------------

describe('EditorChromeService — publishEnabled signal', () => {
  let service: EditorChromeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EditorChromeService,
        CanvasStateService,
        SelectionService,
        SnapGuideService,
      ],
    });
    service = TestBed.inject(EditorChromeService);
  });

  it('publishEnabled() starts true', () => {
    expect(service.publishEnabled()).toBe(true);
  });

  it('setPublishEnabled(false) sets publishEnabled to false', () => {
    service.setPublishEnabled(false);
    expect(service.publishEnabled()).toBe(false);
  });

  it('setPublishEnabled(true) sets publishEnabled back to true', () => {
    service.setPublishEnabled(false);
    service.setPublishEnabled(true);
    expect(service.publishEnabled()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 8. Undo/Redo buttons — plain text labels (Change 1)
// ---------------------------------------------------------------------------

describe('ChromeTopComponent — Undo/Redo plain text labels', () => {
  let fixture: ComponentFixture<ChromeTopComponent>;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ChromeTopComponent],
      providers: [
        EditorChromeService,
        CanvasStateService,
        SelectionService,
        SnapGuideService,
      ],
    });
    fixture = TestBed.createComponent(ChromeTopComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('Undo button displays text "Undo"', () => {
    const undoBtn = el.querySelector('button[title="Undo"]');
    expect(undoBtn?.textContent?.trim()).toBe('Undo');
  });

  it('Redo button displays text "Redo"', () => {
    const redoBtn = el.querySelector('button[title="Redo"]');
    expect(redoBtn?.textContent?.trim()).toBe('Redo');
  });

  it('No <kbd> element in chrome top', () => {
    expect(el.querySelector('kbd')).toBeNull();
  });
});
